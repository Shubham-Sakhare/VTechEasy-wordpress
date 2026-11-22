<?php
/**
 * Plugin Name: Tech Easy Chat Assistant
 * Description: A configurable, rule-based guided chatbot with lead capture.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Tech Easy
 * Text Domain: techeasy-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TEA_CHAT_VERSION', '1.0.0' );
define( 'TEA_CHAT_FILE', __FILE__ );
define( 'TEA_CHAT_DIR', plugin_dir_path( __FILE__ ) );
define( 'TEA_CHAT_URL', plugin_dir_url( __FILE__ ) );
define( 'TEA_CHAT_OPTION', 'techeasy_chat_settings' );
define( 'TEA_CHAT_TABLE', 'techeasy_chat_leads' );

require_once TEA_CHAT_DIR . 'includes/defaults.php';
require_once TEA_CHAT_DIR . 'includes/database.php';
require_once TEA_CHAT_DIR . 'includes/rest.php';
require_once TEA_CHAT_DIR . 'includes/admin.php';
require_once TEA_CHAT_DIR . 'includes/shortcode.php';

register_activation_hook( __FILE__, 'tea_chat_activate' );

/**
 * Initialize defaults and create the leads table.
 *
 * @return void
 */
function tea_chat_activate() {
	if ( false === get_option( TEA_CHAT_OPTION, false ) ) {
		add_option( TEA_CHAT_OPTION, tea_chat_default_settings(), '', false );
	}
	tea_chat_install_table();
}

add_action( 'rest_api_init', 'tea_chat_register_routes' );
add_action( 'admin_menu', 'tea_chat_register_admin_menu' );
add_action( 'admin_enqueue_scripts', 'tea_chat_admin_assets' );
add_action( 'admin_post_tea_chat_save_settings', 'tea_chat_save_settings' );
add_action( 'admin_post_tea_chat_lead_action', 'tea_chat_handle_lead_action' );
add_action( 'admin_post_tea_chat_export_leads', 'tea_chat_export_leads' );
add_action( 'wp_enqueue_scripts', 'tea_chat_register_widget_assets' );

