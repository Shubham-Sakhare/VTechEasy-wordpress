<?php
/**
 * Shortcode and widget assets.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register frontend assets.
 *
 * @return void
 */
function tea_chat_register_widget_assets() {
	wp_register_style( 'techeasy-chat-widget', TEA_CHAT_URL . 'assets/widget.css', array(), TEA_CHAT_VERSION );
	wp_register_script( 'techeasy-chat-widget', TEA_CHAT_URL . 'assets/widget.js', array(), TEA_CHAT_VERSION, true );
}

/**
 * Render the standalone widget root.
 *
 * @return string
 */
function tea_chat_shortcode() {
	wp_enqueue_style( 'techeasy-chat-widget' );
	wp_enqueue_script( 'techeasy-chat-widget' );
	$config_url = rest_url( 'techeasy-chat/v1/config' );
	$leads_url  = rest_url( 'techeasy-chat/v1/leads' );
	return sprintf(
		'<div class="tea-chat-root" data-config-url="%1$s" data-leads-url="%2$s"></div>',
		esc_url( $config_url ),
		esc_url( $leads_url )
	);
}
add_shortcode( 'techeasy_chat', 'tea_chat_shortcode' );

