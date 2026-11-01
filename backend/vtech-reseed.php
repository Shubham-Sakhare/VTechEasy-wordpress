<?php
// One-off: persist merged defaults (header/footer + all registry sections).
// Safe to delete after running. Visit this file in the browser once while
// logged in as an administrator.
define( 'WP_USE_THEMES', false );
require __DIR__ . '/wp-load.php';

if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( 'You must be an administrator to run the reseed.' );
}

// Make sure the section registry has run (it hooks `init`).
do_action( 'init' );

$content = vtech_get_content(); // merges header/footer + section defaults.
update_option( VTECH_CORE_OPTION, $content );

echo 'KEYS: ' . esc_html( implode( ', ', array_keys( $content ) ) ) . "\n";

if ( class_exists( 'VTech_Sections' ) ) {
	echo 'HERO SECTIONS: ' . esc_html( implode( ', ', array_keys( VTech_Sections::in_group( 'hero' ) ) ) ) . "\n";
	echo 'REUSABLE SECTIONS: ' . esc_html( implode( ', ', array_keys( VTech_Sections::in_group( 'reusable' ) ) ) ) . "\n";
}

echo "Done.\n";
