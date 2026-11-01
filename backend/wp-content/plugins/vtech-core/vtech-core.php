<?php
/**
 * Plugin Name: VTech Core
 * Description: Controls the Tech Easy React frontend (Header, Footer and more) from an easy WordPress admin UI, served over the REST API.
 * Version:     1.0.0
 * Author:      Tech Easy
 * Text Domain: vtech-core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'VTECH_CORE_VERSION', '1.0.0' );
define( 'VTECH_CORE_FILE', __FILE__ );
define( 'VTECH_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'VTECH_CORE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Shared option key used to store all layout content as one array.
 */
define( 'VTECH_CORE_OPTION', 'vtech_layout' );

require_once VTECH_CORE_DIR . 'includes/helpers.php';
require_once VTECH_CORE_DIR . 'includes/class-vtech-pages.php';
require_once VTECH_CORE_DIR . 'includes/class-vtech-sections.php';
require_once VTECH_CORE_DIR . 'includes/custom-sections.php';
require_once VTECH_CORE_DIR . 'includes/schema.php';
require_once VTECH_CORE_DIR . 'includes/class-vtech-admin.php';
require_once VTECH_CORE_DIR . 'includes/rest-api.php';
require_once VTECH_CORE_DIR . 'includes/forms.php';

// Each section lives in its own file and registers its own admin screen.
require_once VTECH_CORE_DIR . 'sections/header.php';
require_once VTECH_CORE_DIR . 'sections/footer.php';

// Section registry definitions (heroes + reusable sections).
require_once VTECH_CORE_DIR . 'sections/registry.php';

// Page-builder admin screens (per-page tabs + the Sections manager).
require_once VTECH_CORE_DIR . 'includes/class-vtech-pagebuilder.php';

/**
 * Boot the plugin.
 */
function vtech_core_boot() {
	VTech_Admin::instance();
}
add_action( 'plugins_loaded', 'vtech_core_boot' );

/**
 * On activation, make sure the option exists with sensible defaults
 * (mirrors the React dummy data so the site looks right immediately).
 */
function vtech_core_activate() {
	if ( false === get_option( VTECH_CORE_OPTION, false ) ) {
		add_option( VTECH_CORE_OPTION, vtech_core_default_content() );
	}
}
register_activation_hook( __FILE__, 'vtech_core_activate' );
