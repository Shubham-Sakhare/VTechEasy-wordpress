<?php
/**
 * Public REST API, CORS policy, lead validation and notifications.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the chatbot REST API.
 *
 * @return void
 */
function tea_chat_register_routes() {
	register_rest_route(
		'techeasy-chat/v1',
		'/config',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'tea_chat_rest_config',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'techeasy-chat/v1',
		'/leads',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'tea_chat_rest_submit_lead',
			'permission_callback' => '__return_true',
		)
	);
	add_filter( 'rest_pre_dispatch', 'tea_chat_check_rest_origin', 10, 3 );
	add_filter( 'rest_pre_serve_request', 'tea_chat_send_cors_headers', 100, 4 );
}

/**
 * Normalize an origin for exact allowlist comparisons.
 *
 * @param string $origin Origin URL.
 * @return string
 */
function tea_chat_normalize_origin( $origin ) {
	$parts = wp_parse_url( trim( (string) $origin ) );
	if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
		return '';
	}
	$scheme = strtolower( $parts['scheme'] );
	if ( ! in_array( $scheme, array( 'http', 'https' ), true ) || isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
		return '';
	}
	if ( isset( $parts['path'] ) && '' !== trim( $parts['path'], '/' ) ) {
		return '';
	}
	if ( isset( $parts['query'] ) || isset( $parts['fragment'] ) ) {
		return '';
	}

	$host = strtolower( $parts['host'] );
	$port = isset( $parts['port'] ) ? ':' . absint( $parts['port'] ) : '';
	return $scheme . '://' . $host . $port;
}

/**
 * Check whether a request origin is explicitly configured.
 *
 * @param string $origin Origin URL.
 * @return bool
 */
function tea_chat_is_allowed_origin( $origin ) {
	$normalized = tea_chat_normalize_origin( $origin );
	if ( '' === $normalized ) {
		return false;
	}
	$site_parts = wp_parse_url( home_url( '/' ) );
	if ( is_array( $site_parts ) && ! empty( $site_parts['scheme'] ) && ! empty( $site_parts['host'] ) ) {
		$site_origin = strtolower( $site_parts['scheme'] ) . '://' . strtolower( $site_parts['host'] );
		if ( isset( $site_parts['port'] ) ) {
			$site_origin .= ':' . absint( $site_parts['port'] );
		}
		if ( $normalized === $site_origin ) {
			return true;
		}
	}
	$settings = tea_chat_get_settings();
	$allowed  = isset( $settings['allowed_domains'] ) && is_array( $settings['allowed_domains'] ) ? $settings['allowed_domains'] : array();
	foreach ( $allowed as $domain ) {
		if ( $normalized === tea_chat_normalize_origin( $domain ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Reject cross-origin REST requests unless their origin is configured.
 *
 * @param mixed           $result  Dispatch result.
 * @param WP_REST_Server  $server  REST server.
 * @param WP_REST_Request $request REST request.
 * @return mixed
 */
function tea_chat_check_rest_origin( $result, $server, $request ) {
	unset( $server );
	if ( null !== $result || 0 !== strpos( $request->get_route(), '/techeasy-chat/v1/' ) ) {
		return $result;
	}
	$origin = get_http_origin();
	if ( $origin && ! tea_chat_is_allowed_origin( $origin ) ) {
		return new WP_Error( 'tea_chat_origin_not_allowed', 'This website is not allowed to use the chat service.', array( 'status' => 403 ) );
	}
	return $result;
}

/**
 * Apply the allowlist to CORS response headers for this namespace.
 *
 * @param bool            $served  Whether the response was served.
 * @param WP_HTTP_Response $result Response.
 * @param WP_REST_Request  $request Request.
 * @param WP_REST_Server   $server REST server.
 * @return bool
 */
function tea_chat_send_cors_headers( $served, $result, $request, $server ) {
	unset( $result, $server );
	if ( 0 !== strpos( $request->get_route(), '/techeasy-chat/v1/' ) ) {
		return $served;
	}

	$origin = get_http_origin();
	if ( ! $origin ) {
		return $served;
	}
	header_remove( 'Access-Control-Allow-Origin' );
	header_remove( 'Access-Control-Allow-Credentials' );
	if ( ! tea_chat_is_allowed_origin( $origin ) ) {
		return $served;
	}

	header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
	header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
	header( 'Access-Control-Allow-Headers: Accept, Content-Type' );
	header( 'Access-Control-Max-Age: 600' );
	header( 'Vary: Origin', false );
	return $served;
}

/**
 * Return the public widget settings without private notification values.
 *
 * @return WP_REST_Response
 */
function tea_chat_rest_config() {
	$settings = tea_chat_get_settings();
	$public   = array(
		'welcome'        => $settings['welcome'],
		'bot_name'       => $settings['bot_name'],
		'avatar'         => $settings['avatar'],
		'primary_color'  => $settings['primary_color'],
		'position'       => $settings['position'],
		'quick_questions' => $settings['quick_questions'],
		'faqs'           => $settings['faqs'],
		'lead_questions' => $settings['lead_questions'],
		'fallback'       => $settings['fallback'],
		'actions'        => $settings['actions'],
	);
	return rest_ensure_response( $public );
}

/**
 * Sanitize a public lead field.
 *
 * @param array  $data Input payload.
 * @param string $key Field key.
 * @param bool   $multiline Preserve line breaks.
 * @return string
 */
function tea_chat_request_text( $data, $key, $multiline = false ) {
	if ( ! isset( $data[ $key ] ) || ! is_scalar( $data[ $key ] ) ) {
		return '';
	}
	$value = (string) $data[ $key ];
	return $multiline ? sanitize_textarea_field( $value ) : sanitize_text_field( $value );
}

/**
 * Limit text without requiring the optional mbstring extension.
 *
 * @param string $value Text value.
 * @param int    $length Maximum character count.
 * @return string
 */
function tea_chat_limit_text( $value, $length ) {
	return function_exists( 'mb_substr' ) ? mb_substr( $value, 0, $length ) : substr( $value, 0, $length );
}

/**
 * Apply a maximum of five lead submissions per IP per hour.
 *
 * @return true|WP_Error
 */
function tea_chat_check_rate_limit() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	if ( '' === $ip ) {
		return new WP_Error( 'tea_chat_unavailable', 'Submission is temporarily unavailable. Please try again later.', array( 'status' => 503 ) );
	}
	$key   = 'tea_chat_rate_' . md5( wp_salt( 'auth' ) . '|' . $ip );
	$count = (int) get_transient( $key );
	if ( $count >= 5 ) {
		return new WP_Error( 'tea_chat_rate_limited', 'Too many enquiries. Please try again later.', array( 'status' => 429 ) );
	}
	set_transient( $key, $count + 1, HOUR_IN_SECONDS );
	return true;
}

/**
 * Submit, store and notify a chatbot lead.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function tea_chat_rest_submit_lead( $request ) {
	$data = $request->get_json_params();
	if ( ! is_array( $data ) ) {
		return new WP_Error( 'tea_chat_invalid_submission', 'Please submit a valid enquiry.', array( 'status' => 400 ) );
	}
	if ( '' !== tea_chat_request_text( $data, 'website' ) ) {
		return rest_ensure_response(
			array(
				'success' => true,
				'message' => 'Thank you. Your enquiry has been received.',
			)
		);
	}

	$limited = tea_chat_check_rate_limit();
	if ( is_wp_error( $limited ) ) {
		return $limited;
	}

	$name     = tea_chat_limit_text( tea_chat_request_text( $data, 'name' ), 190 );
	$email    = tea_chat_limit_text( sanitize_email( tea_chat_request_text( $data, 'email' ) ), 190 );
	$mobile   = tea_chat_limit_text( tea_chat_request_text( $data, 'mobile' ), 40 );
	$service  = tea_chat_limit_text( tea_chat_request_text( $data, 'service' ), 190 );
	$interest = tea_chat_limit_text( tea_chat_request_text( $data, 'interest' ), 100 );
	$message  = tea_chat_limit_text( tea_chat_request_text( $data, 'message', true ), 5000 );

	if ( '' === $name || ! is_email( $email ) || '' === $service ) {
		return new WP_Error( 'tea_chat_invalid_submission', 'Please provide your name, a valid email address and service.', array( 'status' => 400 ) );
	}
	$mobile_digits = preg_replace( '/[\s().-]/', '', $mobile );
	if ( ! preg_match( '/^(?:\+91)?[6-9][0-9]{9}$/', $mobile_digits ) ) {
		return new WP_Error( 'tea_chat_invalid_mobile', 'Please enter a valid 10-digit mobile number, optionally with +91.', array( 'status' => 400 ) );
	}
	if ( ! in_array( $interest, array( 'Price', 'Services', 'Timeline', 'Support', 'Other' ), true ) ) {
		return new WP_Error( 'tea_chat_invalid_interest', 'Please choose a valid enquiry topic.', array( 'status' => 400 ) );
	}

	$path = isset( $data['chat_path'] ) && is_array( $data['chat_path'] ) ? array_slice( $data['chat_path'], 0, 60 ) : array();
	$path = array_values(
		array_filter(
			array_map(
				static function ( $step ) {
					return is_scalar( $step ) ? tea_chat_limit_text( sanitize_text_field( (string) $step ), 200 ) : '';
				},
				$path
			),
			'strlen'
		)
	);

	global $wpdb;
	$table_name = $wpdb->prefix . TEA_CHAT_TABLE;
	$ip         = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$inserted   = $wpdb->insert(
		$table_name,
		array(
			'name'       => $name,
			'email'      => $email,
			'mobile'     => $mobile_digits,
			'service'    => $service,
			'interest'   => $interest,
			'message'    => $message,
			'chat_path'  => wp_json_encode( $path ),
			'ip'         => $ip,
			'created_at' => current_time( 'mysql', true ),
			'status'     => 'new',
		),
		array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
	);
	if ( false === $inserted ) {
		return new WP_Error( 'tea_chat_storage_failed', 'We could not save your enquiry. Please try again or contact us directly.', array( 'status' => 500 ) );
	}

	$settings = tea_chat_get_settings();
	$emails   = array_filter( array_map( 'sanitize_email', explode( ',', (string) $settings['notification_emails'] ) ), 'is_email' );
	if ( empty( $emails ) ) {
		$emails = array( get_option( 'admin_email' ) );
	}
	$subject = sprintf( 'New Tech Easy chatbot enquiry from %s', $name );
	$body    = implode(
		"\n",
		array(
			'Name: ' . $name,
			'Email: ' . $email,
			'Mobile: ' . $mobile_digits,
			'Service: ' . $service,
			'Interest: ' . $interest,
			'Message: ' . ( '' !== $message ? $message : '(not provided)' ),
			'Chat path: ' . implode( ' > ', $path ),
		)
	);
	$email_sent = wp_mail( $emails, $subject, $body, array( 'Reply-To: ' . $name . ' <' . $email . '>' ) );

	$webhook_sent = true;
	if ( ! empty( $settings['webhook_url'] ) ) {
		$webhook_response = wp_safe_remote_post(
			$settings['webhook_url'],
			array(
				'timeout'     => 8,
				'redirection' => 3,
				'headers'     => array( 'Content-Type' => 'application/json' ),
				'body'        => wp_json_encode(
					array(
						'name'      => $name,
						'email'     => $email,
						'mobile'    => $mobile_digits,
						'service'   => $service,
						'interest'  => $interest,
						'message'   => $message,
						'chat_path' => $path,
						'created_at' => current_time( 'mysql', true ),
					)
				),
			)
		);
		$webhook_sent = ! is_wp_error( $webhook_response ) && (int) wp_remote_retrieve_response_code( $webhook_response ) < 400;
	}

	$notice = 'Thank you. Your enquiry has been saved.';
	if ( ! $email_sent || ! $webhook_sent ) {
		$notice = 'Your enquiry was saved, but a notification could not be delivered. Please contact us through one of the links below.';
	}

	return new WP_REST_Response(
		array(
			'success'       => true,
			'lead_id'       => (int) $wpdb->insert_id,
			'email_sent'    => (bool) $email_sent,
			'webhook_sent'  => (bool) $webhook_sent,
			'message'       => $notice,
		),
		201
	);
}

