<?php
/**
 * REST API: exposes the layout content for the React frontend.
 *
 * Endpoint: GET /wp-json/vtech/v1/layout
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route(
		'vtech/v1',
		'/layout',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'vtech_rest_layout',
			'permission_callback' => '__return_true', // Public read-only content.
		)
	);

	register_rest_route(
		'vtech/v1',
		'/pages',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'vtech_rest_pages',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'vtech/v1',
		'/page/(?P<slug>[a-z0-9\-]+)',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'vtech_rest_page',
			'permission_callback' => '__return_true',
			'args'                => array(
				'slug' => array(
					'required'          => true,
					'sanitize_callback' => 'sanitize_key',
				),
			),
		)
	);

	register_rest_route(
		'vtech/v1',
		'/contact',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'vtech_rest_contact_submission',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'vtech/v1',
		'/newsletter',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'vtech_rest_newsletter_submission',
			'permission_callback' => '__return_true',
		)
	);
} );

/**
 * GET /vtech/v1/pages — list of frontend pages (slug, label, path).
 *
 * @return WP_REST_Response
 */
function vtech_rest_pages() {
	return rest_ensure_response( array_values( VTech_Pages::all() ) );
}

/**
 * GET /vtech/v1/page/{slug} — a page's hero + ordered reusable sections.
 *
 * @param WP_REST_Request $request request.
 * @return WP_REST_Response|WP_Error
 */
function vtech_rest_page( $request ) {
	$slug = sanitize_key( $request['slug'] );

	if ( ! VTech_Pages::exists( $slug ) ) {
		return new WP_Error( 'vtech_page_not_found', 'Unknown page.', array( 'status' => 404 ) );
	}

	$hero = vtech_hero_for_page( $slug );

	$response = array(
		'slug'     => $slug,
		'hero'     => $hero ? $hero : null,
		'sections' => vtech_sections_for_page( $slug ),
	);

	return rest_ensure_response( $response );
}

/**
 * Build the response for the full layout.
 *
 * @return WP_REST_Response
 */
function vtech_rest_layout() {
	$content = vtech_get_content();

	$response = array(
		'header' => isset( $content['header'] ) ? $content['header'] : array(),
		'footer' => isset( $content['footer'] ) ? $content['footer'] : array(),
	);

	return rest_ensure_response( $response );
}

/**
 * Allow the Vite dev server and configured deployed frontend to call VTech.
 * Preserve WordPress's default CORS headers for every other REST namespace.
 */
add_action( 'rest_api_init', function () {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', function ( $value, $result, $request, $server ) {
		if ( ! ( $request instanceof WP_REST_Request ) || 0 !== strpos( $request->get_route(), '/vtech/v1/' ) ) {
			return rest_send_cors_headers( $value );
		}

		$origin = get_http_origin();

		$allowed = array(
			'http://localhost:5173',
			'http://127.0.0.1:5173',
			'http://localhost:5174',
			'http://127.0.0.1:5174',
			'http://localhost:5175',
			'http://127.0.0.1:5175',
			'http://localhost:5176',
			'http://127.0.0.1:5176',
			'http://localhost:3000',
			'http://localhost',
		);
		$settings = vtech_core_settings();
		if ( ! empty( $settings['frontend_origin'] ) ) {
			$allowed[] = $settings['frontend_origin'];
		}

		if ( $origin && in_array( $origin, $allowed, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
			header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
			header( 'Vary: Origin' );
		}

		return $value;
	}, 15, 4 );
}, 15 );
