<?php
/**
 * Admin bootstrap: top-level menu, asset loading, shared field renderers.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VTech_Admin {

	const MENU_SLUG = 'vtech-layout';
	const CAPABILITY = 'manage_options';

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Register the top-level "VTech Layout" menu.
	 * Section files hook into `vtech_admin_submenus` to add their pages.
	 */
	public function register_menu() {
		add_menu_page(
			__( 'VTech Layout', 'vtech-core' ),
			__( 'VTech Layout', 'vtech-core' ),
			self::CAPABILITY,
			self::MENU_SLUG,
			array( $this, 'render_dashboard' ),
			'dashicons-layout',
			3
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Dashboard', 'vtech-core' ),
			__( 'Dashboard', 'vtech-core' ),
			self::CAPABILITY,
			self::MENU_SLUG,
			array( $this, 'render_dashboard' )
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Settings', 'vtech-core' ),
			__( 'Settings', 'vtech-core' ),
			self::CAPABILITY,
			'vtech-settings',
			array( $this, 'render_settings_page' )
		);

		/**
		 * Let each section register its own submenu page.
		 */
		do_action( 'vtech_admin_submenus', self::MENU_SLUG, self::CAPABILITY );
	}

	/**
	 * Load admin CSS/JS only on our pages.
	 */
	public function enqueue_assets( $hook ) {
		if ( false === strpos( $hook, self::MENU_SLUG ) ) {
			return;
		}

		wp_enqueue_media(); // WordPress media uploader for logo/images.
		wp_enqueue_editor();

		// Cache-bust with the file's mtime so edits show up immediately
		// instead of being served from the browser cache.
		$css = VTECH_CORE_DIR . 'assets/admin.css';
		$js  = VTECH_CORE_DIR . 'assets/admin.js';

		wp_enqueue_style(
			'vtech-admin',
			VTECH_CORE_URL . 'assets/admin.css',
			array(),
			file_exists( $css ) ? (string) filemtime( $css ) : VTECH_CORE_VERSION
		);

		wp_enqueue_script(
			'vtech-admin',
			VTECH_CORE_URL . 'assets/admin.js',
			array( 'jquery', 'jquery-ui-sortable' ),
			file_exists( $js ) ? (string) filemtime( $js ) : VTECH_CORE_VERSION,
			true
		);

		wp_localize_script(
			'vtech-admin',
			'VTechAdmin',
			array(
				'icons' => vtech_feather_icons(),
			)
		);
	}

	/**
	 * Simple dashboard landing page.
	 */
	public function render_dashboard() {
		$rest = esc_url( rest_url( 'vtech/v1/layout' ) );
		$pages = class_exists( 'VTech_Pages' ) ? VTech_Pages::all() : array();
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons dashicons-layout"></span> VTech Layout</h1>
				<p class="vtech-sub">Control your React site's content from here. Changes save instantly to the REST API your frontend reads.</p>
			</div>

			<div class="vtech-cards">
				<a class="vtech-card" href="<?php echo esc_url( admin_url( 'admin.php?page=vtech-settings' ) ); ?>">
					<span class="dashicons dashicons-admin-settings"></span>
					<h2>Settings</h2>
					<p>Manage form notification email and the deployed frontend origin.</p>
				</a>
				<a class="vtech-card" href="<?php echo esc_url( admin_url( 'admin.php?page=vtech-header' ) ); ?>">
					<span class="dashicons dashicons-menu-alt"></span>
					<h2>Header</h2>
					<p>Logo, navigation menu, icons &amp; the call-to-action button.</p>
				</a>
				<a class="vtech-card" href="<?php echo esc_url( admin_url( 'admin.php?page=vtech-footer' ) ); ?>">
					<span class="dashicons dashicons-align-wide"></span>
					<h2>Footer</h2>
					<p>Logo, tagline, link columns, contact details &amp; social icons.</p>
				</a>
				<?php foreach ( $pages as $slug => $page ) : ?>
					<a class="vtech-card" href="<?php echo esc_url( admin_url( 'admin.php?page=vtech-page-' . $slug ) ); ?>">
						<span class="dashicons dashicons-admin-page"></span>
						<h2><?php echo esc_html( $page['label'] ); ?> Page</h2>
						<p>Edit page content, hero and reusable sections. Route: <?php echo esc_html( $page['path'] ); ?></p>
					</a>
				<?php endforeach; ?>
			</div>

			<div class="vtech-rest">
				<strong>Frontend REST endpoint:</strong>
				<code><?php echo $rest; ?></code>
			</div>
		</div>
		<?php
	}

	/**
	 * Render settings for form notifications and frontend CORS.
	 */
	public function render_settings_page() {
		if ( isset( $_POST['vtech_settings_nonce'] ) ) {
			if ( ! current_user_can( self::CAPABILITY ) ) {
				wp_die( esc_html__( 'You are not allowed to manage these settings.', 'vtech-core' ) );
			}

			check_admin_referer( 'vtech_save_settings', 'vtech_settings_nonce' );
			$raw_email = isset( $_POST['notification_email'] ) && is_string( $_POST['notification_email'] ) ? sanitize_email( wp_unslash( $_POST['notification_email'] ) ) : '';
			$raw_origin = isset( $_POST['frontend_origin'] ) && is_string( $_POST['frontend_origin'] ) ? wp_unslash( $_POST['frontend_origin'] ) : '';
			$origin = vtech_sanitize_origin( $raw_origin );

			if ( ! is_email( $raw_email ) ) {
				add_settings_error( 'vtech_settings', 'invalid_email', __( 'Enter a valid notification email address.', 'vtech-core' ), 'error' );
			} elseif ( '' !== trim( $raw_origin ) && '' === $origin ) {
				add_settings_error( 'vtech_settings', 'invalid_origin', __( 'Enter only the frontend origin, for example https://www.example.com (no path).', 'vtech-core' ), 'error' );
			} else {
				update_option(
					'vtech_core_settings',
					array(
						'notification_email' => $raw_email,
						'frontend_origin'    => $origin,
					)
				);
				add_settings_error( 'vtech_settings', 'saved', __( 'Settings saved.', 'vtech-core' ), 'success' );
			}
		}

		$settings = vtech_core_settings();
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons dashicons-admin-settings"></span> VTech Settings</h1>
				<p class="vtech-sub">Set where contact and newsletter requests are sent, and allow your deployed frontend to call the REST API.</p>
			</div>
			<?php settings_errors( 'vtech_settings' ); ?>
			<form method="post" class="vtech-form">
				<?php wp_nonce_field( 'vtech_save_settings', 'vtech_settings_nonce' ); ?>
				<div class="vtech-panel">
					<h2 class="vtech-panel-title">Form Notifications</h2>
					<p class="vtech-hint">Contact messages and newsletter signup requests are emailed here. Configure SMTP on the WordPress host for reliable delivery.</p>
					<?php VTech_Admin::text_field( 'notification_email', $settings['notification_email'], 'Notification Email', 'vtecheasy@gmail.com' ); ?>
				</div>
				<div class="vtech-panel">
					<h2 class="vtech-panel-title">Frontend API Access</h2>
					<p class="vtech-hint">Add the exact deployed website origin, such as https://www.example.com. Leave blank for same-origin hosting. Local Vite development origins remain enabled.</p>
					<?php VTech_Admin::text_field( 'frontend_origin', $settings['frontend_origin'], 'Frontend Origin', 'https://www.example.com' ); ?>
				</div>
				<p class="submit"><button type="submit" class="button button-primary">Save Settings</button></p>
			</form>
		</div>
		<?php
	}

	/* ---------------------------------------------------------------------
	 * Shared field renderers (used by section files)
	 * ------------------------------------------------------------------- */

	/**
	 * Text field.
	 */
	public static function text_field( $name, $value, $label, $placeholder = '' ) {
		printf(
			'<label class="vtech-field"><span class="vtech-label">%1$s</span><input type="text" name="%2$s" value="%3$s" placeholder="%4$s" class="vtech-input" /></label>',
			esc_html( $label ),
			esc_attr( $name ),
			esc_attr( $value ),
			esc_attr( $placeholder )
		);
	}

	/**
	 * Media (image) upload field with preview.
	 */
	public static function media_field( $name, $value, $label ) {
		$has = $value ? ' has-image' : '';
		?>
		<div class="vtech-field vtech-media<?php echo esc_attr( $has ); ?>">
			<span class="vtech-label"><?php echo esc_html( $label ); ?></span>
			<div class="vtech-media-row">
				<div class="vtech-media-preview">
					<?php if ( $value ) : ?>
						<img src="<?php echo esc_url( $value ); ?>" alt="" />
					<?php else : ?>
						<span class="vtech-media-empty dashicons dashicons-format-image"></span>
					<?php endif; ?>
				</div>
				<div class="vtech-media-actions">
					<input type="hidden" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="vtech-media-input" />
					<button type="button" class="button vtech-media-upload">Choose Image</button>
					<button type="button" class="button-link vtech-media-remove">Remove</button>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Select field.
	 *
	 * @param string $name    input name.
	 * @param string $value   current value.
	 * @param string $label   field label.
	 * @param array  $options value => label map.
	 */
	public static function select_field( $name, $value, $label, $options ) {
		echo '<label class="vtech-field"><span class="vtech-label">' . esc_html( $label ) . '</span>';
		echo '<select name="' . esc_attr( $name ) . '" class="vtech-input">';
		foreach ( (array) $options as $opt_value => $opt_label ) {
			echo '<option value="' . esc_attr( $opt_value ) . '"' . selected( (string) $value, (string) $opt_value, false ) . '>' . esc_html( $opt_label ) . '</option>';
		}
		echo '</select></label>';
	}

	/**
	 * Icon picker (searchable Feather icon list) + optional image upload.
	 * The field stores either a Feather icon name (e.g. "code") or an image
	 * URL uploaded via the WP media library.
	 */
	public static function icon_field( $name, $value, $label = 'Icon' ) {
		$is_url = $value && ( 0 === strpos( $value, 'http' ) || 0 === strpos( $value, '/' ) );
		?>
		<div class="vtech-field vtech-iconpicker">
			<span class="vtech-label"><?php echo esc_html( $label ); ?></span>
			<div class="vtech-icon-control">
				<input type="text" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="vtech-input vtech-icon-input" placeholder="none" readonly />
				<button type="button" class="button vtech-icon-open">Pick icon</button>
				<button type="button" class="button vtech-icon-img-upload" title="Upload image icon"><span class="dashicons dashicons-format-image"></span></button>
				<button type="button" class="button-link vtech-icon-clear">Clear</button>
			</div>
			<?php if ( $is_url ) : ?>
				<div class="vtech-icon-img-preview"><img src="<?php echo esc_url( $value ); ?>" alt="" /></div>
			<?php endif; ?>
		</div>
		<?php
	}
}
