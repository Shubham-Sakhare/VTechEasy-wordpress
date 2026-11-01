<?php
/**
 * Header section: admin page + save handling.
 * Slug: vtech-header
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Header submenu.
 */
add_action( 'vtech_admin_submenus', function ( $parent, $cap ) {
	add_submenu_page(
		$parent,
		__( 'Header', 'vtech-core' ),
		__( 'Header', 'vtech-core' ),
		$cap,
		'vtech-header',
		'vtech_render_header_page'
	);
}, 10, 2 );

/**
 * Sanitize + save the submitted header form.
 */
function vtech_save_header() {
	if ( ! isset( $_POST['vtech_header_nonce'] ) || ! wp_verify_nonce( wp_unslash( $_POST['vtech_header_nonce'] ), 'vtech_save_header' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$raw = isset( $_POST['header'] ) ? wp_unslash( $_POST['header'] ) : array();

	$data = array(
		'logo_image' => isset( $raw['logo_image'] ) ? esc_url_raw( $raw['logo_image'] ) : '',
		'logo_text'  => isset( $raw['logo_text'] ) ? sanitize_text_field( $raw['logo_text'] ) : '',
		'menu'       => array(),
		'button'     => array(
			'label' => isset( $raw['button']['label'] ) ? sanitize_text_field( $raw['button']['label'] ) : '',
			'url'   => isset( $raw['button']['url'] ) ? vtech_sanitize_link( $raw['button']['url'] ) : '',
			'icon'  => isset( $raw['button']['icon'] ) ? sanitize_text_field( $raw['button']['icon'] ) : '',
		),
	);

	if ( ! empty( $raw['menu'] ) && is_array( $raw['menu'] ) ) {
		foreach ( $raw['menu'] as $item ) {
			$label = isset( $item['label'] ) ? sanitize_text_field( $item['label'] ) : '';
			if ( '' === $label ) {
				continue;
			}
			$children = array();
			if ( ! empty( $item['children'] ) && is_array( $item['children'] ) ) {
				foreach ( $item['children'] as $child ) {
					$clabel = isset( $child['label'] ) ? sanitize_text_field( $child['label'] ) : '';
					if ( '' === $clabel ) {
						continue;
					}
					$children[] = array(
						'label' => $clabel,
						'url'   => isset( $child['url'] ) ? vtech_sanitize_link( $child['url'] ) : '',
						'icon'  => isset( $child['icon'] ) ? sanitize_text_field( $child['icon'] ) : '',
					);
				}
			}
			$data['menu'][] = array(
				'label'    => $label,
				'url'      => isset( $item['url'] ) ? vtech_sanitize_link( $item['url'] ) : '',
				'icon'     => isset( $item['icon'] ) ? sanitize_text_field( $item['icon'] ) : '',
				'children' => $children,
			);
		}
	}

	vtech_save_section( 'header', $data );

	add_settings_error( 'vtech_header', 'saved', __( 'Header saved.', 'vtech-core' ), 'success' );
}

/**
 * Render the Header admin page.
 */
function vtech_render_header_page() {
	if ( isset( $_POST['vtech_header_nonce'] ) ) {
		vtech_save_header();
	}

	$content = vtech_get_content();
	$header  = $content['header'];
	?>
	<div class="wrap vtech-wrap">
		<div class="vtech-head">
			<h1><span class="dashicons dashicons-menu-alt"></span> Header</h1>
			<p class="vtech-sub">Logo, navigation menu with icons &amp; sub-items, and the call-to-action button.</p>
		</div>

		<?php settings_errors( 'vtech_header' ); ?>

		<form method="post" class="vtech-form">
			<?php wp_nonce_field( 'vtech_save_header', 'vtech_header_nonce' ); ?>

			<!-- Logo -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Logo</h2>
				<div class="vtech-grid-2">
					<?php
					VTech_Admin::media_field( 'header[logo_image]', $header['logo_image'], 'Logo Image' );
					VTech_Admin::text_field( 'header[logo_text]', $header['logo_text'], 'Logo Text (fallback / alt)', 'Tech Easy' );
					?>
				</div>
			</div>

			<!-- Menu -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Navigation Menu</h2>
				<p class="vtech-hint">Drag the handle to reorder. Each item can have an icon and sub-menu links.</p>

				<div class="vtech-repeater" data-repeater="menu">
					<div class="vtech-repeater-items">
						<?php
						if ( ! empty( $header['menu'] ) ) {
							foreach ( $header['menu'] as $i => $item ) {
								vtech_render_menu_row( $i, $item );
							}
						}
						?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="menu">+ Add Menu Item</button>
				</div>
			</div>

			<!-- Button -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Header Button</h2>
				<div class="vtech-grid-3">
					<?php
					VTech_Admin::text_field( 'header[button][label]', $header['button']['label'], 'Button Text', 'Get Started' );
					VTech_Admin::text_field( 'header[button][url]', $header['button']['url'], 'Button Link', '#contact' );
					VTech_Admin::icon_field( 'header[button][icon]', $header['button']['icon'], 'Button Icon' );
					?>
				</div>
			</div>

			<?php submit_button( 'Save Header' ); ?>
		</form>
	</div>

	<!-- Row template for JS cloning -->
	<script type="text/html" id="vtech-tmpl-menu">
		<?php vtech_render_menu_row( '__INDEX__', array( 'label' => '', 'url' => '', 'icon' => '', 'children' => array() ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-submenu">
		<?php vtech_render_submenu_row( '__INDEX__', '__CINDEX__', array( 'label' => '', 'url' => '', 'icon' => '' ) ); ?>
	</script>
	<?php
}

/**
 * Render a single top-level menu row (with its sub-menu block).
 */
function vtech_render_menu_row( $i, $item ) {
	$item = wp_parse_args( $item, array( 'label' => '', 'url' => '', 'icon' => '', 'children' => array() ) );
	?>
	<div class="vtech-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main vtech-grid-3">
			<?php
			VTech_Admin::text_field( "header[menu][$i][label]", $item['label'], 'Label', 'Home' );
			VTech_Admin::text_field( "header[menu][$i][url]", $item['url'], 'Link', '#home' );
			VTech_Admin::icon_field( "header[menu][$i][icon]", $item['icon'], 'Icon' );
			?>
		</div>

		<div class="vtech-sub-block">
			<div class="vtech-sub-head">
				<span>Sub-menu</span>
				<button type="button" class="button-link vtech-add-sub" data-parent="<?php echo esc_attr( $i ); ?>">+ Add sub-item</button>
			</div>
			<div class="vtech-sub-items" data-sub-items="<?php echo esc_attr( $i ); ?>">
				<?php
				if ( ! empty( $item['children'] ) ) {
					foreach ( $item['children'] as $ci => $child ) {
						vtech_render_submenu_row( $i, $ci, $child );
					}
				}
				?>
			</div>
		</div>

		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * Render a single sub-menu row.
 */
function vtech_render_submenu_row( $i, $ci, $child ) {
	$child = wp_parse_args( $child, array( 'label' => '', 'url' => '', 'icon' => '' ) );
	?>
	<div class="vtech-row vtech-subrow" data-subrow>
		<div class="vtech-row-main vtech-grid-3">
			<?php
			VTech_Admin::text_field( "header[menu][$i][children][$ci][label]", $child['label'], 'Label', 'Sub item' );
			VTech_Admin::text_field( "header[menu][$i][children][$ci][url]", $child['url'], 'Link', '#' );
			VTech_Admin::icon_field( "header[menu][$i][children][$ci][icon]", $child['icon'], 'Icon' );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}
