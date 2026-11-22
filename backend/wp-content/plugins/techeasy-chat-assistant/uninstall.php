<?php
/**
 * Remove plugin data only when the administrator opted in.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$settings = get_option( 'techeasy_chat_settings', array() );
if ( ! is_array( $settings ) || empty( $settings['delete_data_on_uninstall'] ) ) {
	return;
}

global $wpdb;
$table_name = $wpdb->prefix . 'techeasy_chat_leads';
$wpdb->query( "DROP TABLE IF EXISTS `$table_name`" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange
delete_option( 'techeasy_chat_settings' );
