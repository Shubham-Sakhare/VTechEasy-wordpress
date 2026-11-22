<?php
/**
 * Leads database and uninstall handler.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Create or update the custom leads table.
 *
 * @return void
 */
function tea_chat_install_table() {
	global $wpdb;

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$table_name      = $wpdb->prefix . TEA_CHAT_TABLE;
	$charset_collate = $wpdb->get_charset_collate();
	$sql             = "CREATE TABLE $table_name (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		name varchar(190) NOT NULL,
		email varchar(190) NOT NULL,
		mobile varchar(40) NOT NULL,
		service varchar(190) NOT NULL,
		interest varchar(100) NOT NULL DEFAULT '',
		message text NOT NULL,
		chat_path longtext NOT NULL,
		ip varchar(45) NOT NULL DEFAULT '',
		created_at datetime NOT NULL,
		status varchar(20) NOT NULL DEFAULT 'new',
		PRIMARY KEY  (id),
		KEY created_at (created_at),
		KEY service (service),
		KEY status (status)
	) $charset_collate;";

	dbDelta( $sql );
}

