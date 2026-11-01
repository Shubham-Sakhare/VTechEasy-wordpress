<?php
/**
 * Public form submission handlers.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Apply a small per-IP request limit to public forms.
 *
 * @param string $form Form identifier.
 * @return true|WP_Error
 */
function vtech_form_rate_limit( $form ) {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	if ( '' === $ip ) {
		return new WP_Error( 'vtech_form_unavailable', 'Submission is temporarily unavailable. Please try again later.', array( 'status' => 503 ) );
	}

	$key   = 'vtech_form_' . md5( wp_salt( 'auth' ) . '|' . $form . '|' . $ip );
	$count = (int) get_transient( $key );
	if ( $count >= 5 ) {
		return new WP_Error( 'vtech_rate_limited', 'Too many submissions. Please try again later.', array( 'status' => 429 ) );
	}

	set_transient( $key, $count + 1, 15 * MINUTE_IN_SECONDS );
	return true;
}

/**
 * Get validated JSON fields from a form request.
 *
 * @param WP_REST_Request $request REST request.
 * @return array|WP_Error
 */
function vtech_form_request_data( $request ) {
	$data = $request->get_json_params();
	if ( ! is_array( $data ) ) {
		return new WP_Error( 'vtech_invalid_submission', 'Invalid submission.', array( 'status' => 400 ) );
	}
	return $data;
}

/**
 * Silently accept honeypot submissions without sending email.
 *
 * @param array $data Submission data.
 * @return bool
 */
function vtech_form_is_spam( $data ) {
	return ! empty( $data['website'] );
}

/**
 * Sanitize a scalar form value without accepting nested request data.
 *
 * @param array  $data Submission data.
 * @param string $key Field key.
 * @param bool   $multiline Whether line breaks should be preserved.
 * @return string
 */
function vtech_form_text_value( $data, $key, $multiline = false ) {
	if ( ! isset( $data[ $key ] ) || ! is_scalar( $data[ $key ] ) ) {
		return '';
	}
	$value = (string) $data[ $key ];
	return $multiline ? sanitize_textarea_field( $value ) : sanitize_text_field( $value );
}

/**
 * Get the active contact form field definitions.
 *
 * @return array
 */
function vtech_contact_form_fields() {
	$section = vtech_get_section_content( 'contact_content' );
	$fields  = isset( $section['form']['fields'] ) && is_array( $section['form']['fields'] ) ? $section['form']['fields'] : array();
	$form    = isset( $section['form'] ) && is_array( $section['form'] ) ? $section['form'] : array();
	if ( ! isset( $form['fields'] ) || ! is_array( $form['fields'] ) ) {
		$services = isset( $form['services'] ) && is_array( $form['services'] ) ? array_filter( array_map( 'sanitize_text_field', wp_list_pluck( $form['services'], 'name' ) ) ) : array();
		$fields   = array(
			array( 'key' => 'name', 'label' => isset( $form['name_label'] ) ? $form['name_label'] : 'Your Name', 'type' => 'text', 'placeholder' => isset( $form['name_placeholder'] ) ? $form['name_placeholder'] : 'Enter your name', 'required' => 1 ),
			array( 'key' => 'email', 'label' => isset( $form['email_label'] ) ? $form['email_label'] : 'Email Address', 'type' => 'email', 'placeholder' => isset( $form['email_placeholder'] ) ? $form['email_placeholder'] : 'Enter your email', 'required' => 1 ),
			array( 'key' => 'phone', 'label' => isset( $form['phone_label'] ) ? $form['phone_label'] : 'Phone Number', 'type' => 'tel', 'placeholder' => isset( $form['phone_placeholder'] ) ? $form['phone_placeholder'] : 'Enter your phone number', 'required' => 1 ),
		);
		if ( ! empty( $services ) ) {
			$fields[] = array(
				'key'     => 'service',
				'label'   => isset( $form['service_label'] ) ? $form['service_label'] : 'Service',
				'type'    => 'select',
				'options' => implode( "\n", $services ),
			);
		}
		$fields[] = array(
			'key'         => 'details',
			'label'       => isset( $form['details_label'] ) ? $form['details_label'] : 'Project Details',
			'type'        => 'textarea',
			'placeholder' => isset( $form['details_placeholder'] ) ? $form['details_placeholder'] : '',
		);
	}
	$allowed = array( 'text', 'textarea', 'email', 'tel', 'number', 'url', 'select', 'radio', 'checkbox', 'checkboxes', 'date', 'time', 'datetime-local', 'image', 'pdf', 'file' );
	$out     = array();
	$used    = array();

	foreach ( $fields as $field ) {
		if ( ! is_array( $field ) ) {
			continue;
		}
		$key  = isset( $field['key'] ) && is_scalar( $field['key'] ) ? sanitize_key( (string) $field['key'] ) : '';
		$type = isset( $field['type'] ) && is_scalar( $field['type'] ) ? sanitize_key( (string) $field['type'] ) : 'text';
		if ( '' === $key || 'website' === $key || 'fields' === $key || ! preg_match( '/^[a-z][a-z0-9_]{0,39}$/', $key ) || isset( $used[ $key ] ) || ! in_array( $type, $allowed, true ) ) {
			continue;
		}
		$used[ $key ] = true;
		$options      = isset( $field['options'] ) && is_scalar( $field['options'] ) ? preg_split( '/\r\n|\r|\n/', (string) $field['options'] ) : array();
		$options      = array_values( array_filter( array_map( 'sanitize_text_field', $options ), 'strlen' ) );
		$out[]        = array(
			'key'         => $key,
			'label'       => isset( $field['label'] ) ? sanitize_text_field( $field['label'] ) : $key,
			'type'        => $type,
			'placeholder' => isset( $field['placeholder'] ) && is_scalar( $field['placeholder'] ) ? sanitize_text_field( $field['placeholder'] ) : '',
			'required'    => ! empty( $field['required'] ),
			'options'     => $options,
			'file_types'  => isset( $field['file_types'] ) && is_string( $field['file_types'] ) && in_array( $field['file_types'], array( 'documents', 'images', 'all' ), true ) ? $field['file_types'] : 'documents',
			'multiple'    => ! empty( $field['multiple'] ),
		);
	}

	return $out;
}

/**
 * Return the MIME allowlist for a configured upload field.
 *
 * @param array $field field definition.
 * @return array
 */
function vtech_form_allowed_mimes( $field ) {
	$documents = array(
		'pdf'  => 'application/pdf',
		'doc'  => 'application/msword',
		'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'txt'  => 'text/plain',
		'csv'  => 'text/csv',
		'xls'  => 'application/vnd.ms-excel',
		'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	);
	$images = array(
		'jpg|jpeg|jpe' => 'image/jpeg',
		'png'          => 'image/png',
		'gif'          => 'image/gif',
		'webp'         => 'image/webp',
	);

	if ( 'image' === $field['type'] ) {
		return $images;
	}
	if ( 'pdf' === $field['type'] ) {
		return array( 'pdf' => 'application/pdf' );
	}
	if ( 'images' === $field['file_types'] ) {
		return $images;
	}
	if ( 'all' === $field['file_types'] ) {
		return array_merge( $documents, $images );
	}
	return $documents;
}

/**
 * Get normalized uploads for a multipart form field.
 *
 * @param array $files REST file params.
 * @param string $param file parameter name.
 * @return array
 */
function vtech_form_normalize_uploads( $files, $param ) {
	if ( ! isset( $files[ $param ] ) || ! is_array( $files[ $param ] ) ) {
		return array();
	}
	$file = $files[ $param ];
	if ( isset( $file['name'] ) && is_array( $file['name'] ) ) {
		$out = array();
		foreach ( $file['name'] as $index => $name ) {
			$out[] = array(
				'name'     => $name,
				'type'     => isset( $file['type'][ $index ] ) ? $file['type'][ $index ] : '',
				'tmp_name' => isset( $file['tmp_name'][ $index ] ) ? $file['tmp_name'][ $index ] : '',
				'error'    => isset( $file['error'][ $index ] ) ? $file['error'][ $index ] : UPLOAD_ERR_NO_FILE,
				'size'     => isset( $file['size'][ $index ] ) ? $file['size'][ $index ] : 0,
			);
		}
		return $out;
	}
	return array( $file );
}

/**
 * Validate submitted form values and attach uploaded files to the notification.
 *
 * @param array $fields configured fields.
 * @param array $values submitted values.
 * @param array $files REST file params.
 * @return array|WP_Error
 */
function vtech_contact_form_submission( $fields, $values, $files ) {
	if ( empty( $fields ) ) {
		return new WP_Error( 'vtech_form_unavailable', 'The contact form has no fields configured. Please contact the site administrator.', array( 'status' => 503 ) );
	}

	$lines       = array();
	$attachments = array();
	$reply_email = '';
	$file_count  = 0;

	foreach ( $fields as $field ) {
		$key   = $field['key'];
		$type  = $field['type'];
		$label = '' !== $field['label'] ? $field['label'] : $key;
		$raw   = isset( $values[ $key ] ) ? $values[ $key ] : null;
		$value = '';

		if ( in_array( $type, array( 'image', 'pdf', 'file' ), true ) ) {
			$uploads = vtech_form_normalize_uploads( $files, 'upload_' . $key );
			$uploads = array_values(
				array_filter(
					$uploads,
					function ( $upload ) {
						return isset( $upload['error'] ) && UPLOAD_ERR_NO_FILE !== (int) $upload['error'];
					}
				)
			);
			if ( $field['required'] && empty( $uploads ) ) {
				return new WP_Error( 'vtech_required_field', sprintf( 'Please attach a file for %s.', $label ), array( 'status' => 400 ) );
			}
			if ( ! $field['multiple'] && count( $uploads ) > 1 ) {
				return new WP_Error( 'vtech_invalid_upload', sprintf( 'Only one file is allowed for %s.', $label ), array( 'status' => 400 ) );
			}
			foreach ( $uploads as $upload ) {
				++$file_count;
				$max_upload_size = min( 8 * MB_IN_BYTES, wp_max_upload_size() );
				if ( $file_count > 5 || ! isset( $upload['error'], $upload['size'], $upload['tmp_name'], $upload['name'] ) ||
					UPLOAD_ERR_OK !== (int) $upload['error'] || (int) $upload['size'] > $max_upload_size ||
					! is_uploaded_file( $upload['tmp_name'] ) ) {
					return new WP_Error( 'vtech_invalid_upload', 'Each upload must be under the server upload limit (maximum 8 MB per file and 5 files).', array( 'status' => 400 ) );
				}
				$mimes = vtech_form_allowed_mimes( $field );
				$check = wp_check_filetype_and_ext( $upload['tmp_name'], sanitize_file_name( $upload['name'] ), $mimes );
				if ( empty( $check['type'] ) || ! in_array( $check['type'], $mimes, true ) ) {
					return new WP_Error( 'vtech_invalid_upload_type', sprintf( 'The file type is not allowed for %s.', $label ), array( 'status' => 400 ) );
				}
				$attachments[] = $upload['tmp_name'];
				$lines[]       = $label . ': ' . sanitize_file_name( $upload['name'] ) . ' (attached)';
			}
			continue;
		}

		if ( 'checkboxes' === $type ) {
			$submitted = is_array( $raw ) ? $raw : array();
			$value     = array_values( array_intersect( array_map( 'sanitize_text_field', array_filter( $submitted, 'is_scalar' ) ), $field['options'] ) );
			$value     = implode( ', ', $value );
		} elseif ( 'checkbox' === $type ) {
			$value = is_scalar( $raw ) && in_array( (string) $raw, array( '1', 'on', 'true' ), true ) ? 'Yes' : 'No';
		} elseif ( 'number' === $type ) {
			if ( null !== $raw && '' !== $raw && ! is_numeric( $raw ) ) {
				return new WP_Error( 'vtech_invalid_submission', sprintf( 'Enter a valid number for %s.', $label ), array( 'status' => 400 ) );
			}
			$value = null !== $raw && '' !== $raw ? (string) ( 0 + $raw ) : '';
		} elseif ( 'email' === $type ) {
			$value = sanitize_email( vtech_form_text_value( $values, $key ) );
			if ( '' !== $value && ! is_email( $value ) ) {
				return new WP_Error( 'vtech_invalid_submission', sprintf( 'Enter a valid email address for %s.', $label ), array( 'status' => 400 ) );
			}
			if ( '' !== $value && '' === $reply_email ) {
				$reply_email = $value;
			}
		} elseif ( in_array( $type, array( 'select', 'radio' ), true ) ) {
			$value = vtech_form_text_value( $values, $key );
			if ( '' !== $value && ! in_array( $value, $field['options'], true ) ) {
				return new WP_Error( 'vtech_invalid_submission', sprintf( 'Select a valid option for %s.', $label ), array( 'status' => 400 ) );
			}
		} elseif ( in_array( $type, array( 'date', 'time', 'datetime-local' ), true ) ) {
			$value = vtech_form_text_value( $values, $key );
			$valid = 'date' === $type
				? (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) && checkdate( (int) substr( $value, 5, 2 ), (int) substr( $value, 8, 2 ), (int) substr( $value, 0, 4 ) )
				: ( 'time' === $type
					? (bool) preg_match( '/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value )
					: (bool) preg_match( '/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/', $value ) );
			if ( '' !== $value && ! $valid ) {
				return new WP_Error( 'vtech_invalid_submission', sprintf( 'Enter a valid date or time for %s.', $label ), array( 'status' => 400 ) );
			}
		} else {
			$value = vtech_form_text_value( $values, $key, 'textarea' === $type );
			if ( 'url' === $type && '' !== $value && ! wp_http_validate_url( $value ) ) {
				return new WP_Error( 'vtech_invalid_submission', sprintf( 'Enter a valid website URL for %s.', $label ), array( 'status' => 400 ) );
			}
		}

		if ( $field['required'] && ( '' === $value || ( 'checkbox' === $type && 'No' === $value ) ) ) {
			return new WP_Error( 'vtech_required_field', sprintf( '%s is required.', $label ), array( 'status' => 400 ) );
		}
		if ( strlen( $value ) > 12000 ) {
			return new WP_Error( 'vtech_invalid_submission', sprintf( '%s is too long.', $label ), array( 'status' => 400 ) );
		}
		$lines[] = $label . ': ' . ( '' !== $value ? $value : '(not provided)' );
	}

	return array(
		'body'        => implode( "\n", $lines ),
		'attachments' => $attachments,
		'reply_email' => $reply_email,
	);
}

/**
 * Send a contact message to the configured notification address.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function vtech_rest_contact_submission( $request ) {
	$limited = vtech_form_rate_limit( 'contact' );
	if ( is_wp_error( $limited ) ) {
		return $limited;
	}

	$body_data = $request->get_body_params();
	$data      = isset( $body_data['fields'] ) && is_string( $body_data['fields'] ) ? json_decode( $body_data['fields'], true ) : $request->get_json_params();
	if ( ! is_array( $data ) ) {
		return new WP_Error( 'vtech_invalid_submission', 'Invalid submission.', array( 'status' => 400 ) );
	}
	if ( vtech_form_is_spam( $data ) ) {
		return rest_ensure_response( array( 'message' => 'Your message has been sent.' ) );
	}

	$submitted = vtech_contact_form_submission( vtech_contact_form_fields(), $data, $request->get_file_params() );
	if ( is_wp_error( $submitted ) ) {
		return $submitted;
	}

	$settings  = vtech_core_settings();
	$recipient = sanitize_email( $settings['notification_email'] );
	if ( ! is_email( $recipient ) ) {
		return new WP_Error( 'vtech_mail_not_configured', 'Form notifications are not configured. Please contact the site administrator.', array( 'status' => 503 ) );
	}

	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );
	if ( '' !== $submitted['reply_email'] ) {
		$headers[] = 'Reply-To: ' . $submitted['reply_email'];
	}
	$sent = wp_mail(
		$recipient,
		'Website contact form submission',
		$submitted['body'],
		$headers,
		$submitted['attachments']
	);
	if ( ! $sent ) {
		return new WP_Error( 'vtech_mail_failed', 'Your message could not be sent right now. Please try again or email us directly.', array( 'status' => 500 ) );
	}

	return rest_ensure_response( array( 'message' => 'Your message has been sent. We will be in touch soon.' ) );
}

/**
 * Email a newsletter signup request to the configured notification address.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function vtech_rest_newsletter_submission( $request ) {
	$limited = vtech_form_rate_limit( 'newsletter' );
	if ( is_wp_error( $limited ) ) {
		return $limited;
	}

	$data = vtech_form_request_data( $request );
	if ( is_wp_error( $data ) ) {
		return $data;
	}
	if ( vtech_form_is_spam( $data ) ) {
		return rest_ensure_response( array( 'message' => 'Your newsletter request has been sent.' ) );
	}

	$email = sanitize_email( vtech_form_text_value( $data, 'email' ) );
	if ( ! is_email( $email ) || strlen( $email ) > 254 ) {
		return new WP_Error( 'vtech_invalid_submission', 'Enter a valid email address.', array( 'status' => 400 ) );
	}

	$settings  = vtech_core_settings();
	$recipient = sanitize_email( $settings['notification_email'] );
	if ( ! is_email( $recipient ) ) {
		return new WP_Error( 'vtech_mail_not_configured', 'Newsletter notifications are not configured. Please contact the site administrator.', array( 'status' => 503 ) );
	}

	$sent = wp_mail(
		$recipient,
		'Website newsletter signup request',
		'Newsletter signup requested by: ' . $email,
		array( 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email )
	);
	if ( ! $sent ) {
		return new WP_Error( 'vtech_mail_failed', 'Your request could not be sent right now. Please try again later.', array( 'status' => 500 ) );
	}

	return rest_ensure_response( array( 'message' => 'Thanks. Your newsletter request has been sent.' ) );
}
