<?php
/**
 * Footer section: admin page + save handling.
 * Slug: vtech-footer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Footer submenu.
 */
add_action( 'vtech_admin_submenus', function ( $parent, $cap ) {
	add_submenu_page(
		$parent,
		__( 'Footer', 'vtech-core' ),
		__( 'Footer', 'vtech-core' ),
		$cap,
		'vtech-footer',
		'vtech_render_footer_page'
	);
}, 20, 2 );

/**
 * Sanitize + save the submitted footer form.
 */
function vtech_save_footer() {
	if ( ! isset( $_POST['vtech_footer_nonce'] ) || ! wp_verify_nonce( wp_unslash( $_POST['vtech_footer_nonce'] ), 'vtech_save_footer' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$raw = isset( $_POST['footer'] ) ? wp_unslash( $_POST['footer'] ) : array();

	$data = array(
		'logo_image' => isset( $raw['logo_image'] ) ? esc_url_raw( $raw['logo_image'] ) : '',
		'logo_text'  => isset( $raw['logo_text'] ) ? sanitize_text_field( $raw['logo_text'] ) : '',
		'tagline'    => isset( $raw['tagline'] ) ? sanitize_textarea_field( $raw['tagline'] ) : '',
		'columns'   => array(),
		'contact'   => array(
			'title'   => isset( $raw['contact']['title'] ) ? sanitize_text_field( $raw['contact']['title'] ) : '',
			'address' => isset( $raw['contact']['address'] ) ? sanitize_text_field( $raw['contact']['address'] ) : '',
			'phone'   => isset( $raw['contact']['phone'] ) ? sanitize_text_field( $raw['contact']['phone'] ) : '',
			'email'   => isset( $raw['contact']['email'] ) ? sanitize_email( $raw['contact']['email'] ) : '',
			'hours'   => isset( $raw['contact']['hours'] ) ? sanitize_text_field( $raw['contact']['hours'] ) : '',
		),
		'socials'   => array(),
		'copyright' => isset( $raw['copyright'] ) ? sanitize_text_field( $raw['copyright'] ) : '',
		'legal'     => array(),
	);

	// Columns (each with a title + links).
	if ( ! empty( $raw['columns'] ) && is_array( $raw['columns'] ) ) {
		foreach ( $raw['columns'] as $col ) {
			$title = isset( $col['title'] ) ? sanitize_text_field( $col['title'] ) : '';
			$links = array();
			if ( ! empty( $col['links'] ) && is_array( $col['links'] ) ) {
				foreach ( $col['links'] as $link ) {
					$label = isset( $link['label'] ) ? sanitize_text_field( $link['label'] ) : '';
					if ( '' === $label ) {
						continue;
					}
					$links[] = array(
						'label' => $label,
						'url'   => isset( $link['url'] ) ? vtech_sanitize_link( $link['url'] ) : '',
					);
				}
			}
			if ( '' === $title && empty( $links ) ) {
				continue;
			}
			$data['columns'][] = array( 'title' => $title, 'links' => $links );
		}
	}

	// Socials.
	if ( ! empty( $raw['socials'] ) && is_array( $raw['socials'] ) ) {
		foreach ( $raw['socials'] as $s ) {
			$icon = isset( $s['icon'] ) ? sanitize_text_field( $s['icon'] ) : '';
			if ( '' === $icon ) {
				continue;
			}
			$data['socials'][] = array(
				'icon' => $icon,
				'url'  => isset( $s['url'] ) ? vtech_sanitize_link( $s['url'] ) : '',
			);
		}
	}

	// Legal links.
	if ( ! empty( $raw['legal'] ) && is_array( $raw['legal'] ) ) {
		foreach ( $raw['legal'] as $l ) {
			$label = isset( $l['label'] ) ? sanitize_text_field( $l['label'] ) : '';
			if ( '' === $label ) {
				continue;
			}
			$data['legal'][] = array(
				'label' => $label,
				'url'   => isset( $l['url'] ) ? vtech_sanitize_link( $l['url'] ) : '',
			);
		}
	}

	vtech_save_section( 'footer', $data );

	add_settings_error( 'vtech_footer', 'saved', __( 'Footer saved.', 'vtech-core' ), 'success' );
}

/**
 * Render the Footer admin page.
 */
function vtech_render_footer_page() {
	if ( isset( $_POST['vtech_footer_nonce'] ) ) {
		vtech_save_footer();
	}

	$content = vtech_get_content();
	$footer  = $content['footer'];
	?>
	<div class="wrap vtech-wrap">
		<div class="vtech-head">
			<h1><span class="dashicons dashicons-align-wide"></span> Footer</h1>
			<p class="vtech-sub">Logo, text below the logo, link columns, contact details, social icons &amp; legal links.</p>
		</div>

		<?php settings_errors( 'vtech_footer' ); ?>

		<form method="post" class="vtech-form">
			<?php wp_nonce_field( 'vtech_save_footer', 'vtech_footer_nonce' ); ?>

			<!-- Footer brand -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Footer Logo &amp; Text</h2>
				<div class="vtech-grid-2">
					<?php
					VTech_Admin::media_field( 'footer[logo_image]', isset( $footer['logo_image'] ) ? $footer['logo_image'] : '', 'Footer Logo Image' );
					VTech_Admin::text_field( 'footer[logo_text]', isset( $footer['logo_text'] ) ? $footer['logo_text'] : 'Tech Easy', 'Logo Alt Text', 'Tech Easy' );
					VTech_Schema::render_field( array( 'type' => 'textarea', 'label' => 'Text below logo (tagline)' ), 'footer[tagline]', isset( $footer['tagline'] ) ? $footer['tagline'] : '', 'tagline' );
					VTech_Admin::text_field( 'footer[copyright]', $footer['copyright'], 'Copyright Text', '© 2025 Tech Easy...' );
					?>
				</div>
			</div>

			<!-- Columns -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Link Columns</h2>
				<p class="vtech-hint">Each column has a title and a list of links. Drag to reorder.</p>

				<div class="vtech-repeater" data-repeater="columns">
					<div class="vtech-repeater-items">
						<?php
						if ( ! empty( $footer['columns'] ) ) {
							foreach ( $footer['columns'] as $i => $col ) {
								vtech_render_footer_column( $i, $col );
							}
						}
						?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="columns">+ Add Column</button>
				</div>
			</div>

			<!-- Contact -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Contact</h2>
				<div class="vtech-grid-2">
					<?php
					VTech_Admin::text_field( 'footer[contact][title]', $footer['contact']['title'], 'Heading', 'Get In Touch' );
					VTech_Admin::text_field( 'footer[contact][address]', $footer['contact']['address'], 'Address', '' );
					VTech_Admin::text_field( 'footer[contact][phone]', $footer['contact']['phone'], 'Phone', '' );
					VTech_Admin::text_field( 'footer[contact][email]', $footer['contact']['email'], 'Email', '' );
					VTech_Admin::text_field( 'footer[contact][hours]', $footer['contact']['hours'], 'Working Hours', '' );
					?>
				</div>
			</div>

			<!-- Socials -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Social Links</h2>
				<p class="vtech-hint">Pick an icon and set the profile link.</p>
				<div class="vtech-repeater" data-repeater="socials">
					<div class="vtech-repeater-items">
						<?php
						if ( ! empty( $footer['socials'] ) ) {
							foreach ( $footer['socials'] as $i => $s ) {
								vtech_render_footer_social( $i, $s );
							}
						}
						?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="socials">+ Add Social</button>
				</div>
			</div>

			<!-- Legal -->
			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Legal Links</h2>
				<div class="vtech-repeater" data-repeater="legal">
					<div class="vtech-repeater-items">
						<?php
						if ( ! empty( $footer['legal'] ) ) {
							foreach ( $footer['legal'] as $i => $l ) {
								vtech_render_footer_legal( $i, $l );
							}
						}
						?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="legal">+ Add Legal Link</button>
				</div>
			</div>

			<?php submit_button( 'Save Footer' ); ?>
		</form>
	</div>

	<!-- Row templates for JS cloning -->
	<script type="text/html" id="vtech-tmpl-columns">
		<?php vtech_render_footer_column( '__INDEX__', array( 'title' => '', 'links' => array() ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-collink">
		<?php vtech_render_footer_collink( '__INDEX__', '__CINDEX__', array( 'label' => '', 'url' => '' ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-socials">
		<?php vtech_render_footer_social( '__INDEX__', array( 'icon' => '', 'url' => '' ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-legal">
		<?php vtech_render_footer_legal( '__INDEX__', array( 'label' => '', 'url' => '' ) ); ?>
	</script>
	<?php
}

/**
 * A footer column (title + its own links repeater).
 */
function vtech_render_footer_column( $i, $col ) {
	$col = wp_parse_args( $col, array( 'title' => '', 'links' => array() ) );
	?>
	<div class="vtech-row vtech-col-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main">
			<?php VTech_Admin::text_field( "footer[columns][$i][title]", $col['title'], 'Column Title', 'Quick Links' ); ?>

			<div class="vtech-sub-block">
				<div class="vtech-sub-head">
					<span>Links</span>
					<button type="button" class="button-link vtech-add-sub" data-sub="collink" data-parent="<?php echo esc_attr( $i ); ?>">+ Add link</button>
				</div>
				<div class="vtech-sub-items" data-sub-items="<?php echo esc_attr( $i ); ?>">
					<?php
					if ( ! empty( $col['links'] ) ) {
						foreach ( $col['links'] as $ci => $link ) {
							vtech_render_footer_collink( $i, $ci, $link );
						}
					}
					?>
				</div>
			</div>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * A single link inside a footer column.
 */
function vtech_render_footer_collink( $i, $ci, $link ) {
	$link = wp_parse_args( $link, array( 'label' => '', 'url' => '' ) );
	?>
	<div class="vtech-row vtech-subrow" data-subrow>
		<div class="vtech-row-main vtech-grid-2">
			<?php
			VTech_Admin::text_field( "footer[columns][$i][links][$ci][label]", $link['label'], 'Label', 'Home' );
			VTech_Admin::text_field( "footer[columns][$i][links][$ci][url]", $link['url'], 'Link', '#home' );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * A social row (icon + url).
 */
function vtech_render_footer_social( $i, $s ) {
	$s = wp_parse_args( $s, array( 'icon' => '', 'url' => '' ) );
	?>
	<div class="vtech-row vtech-subrow" data-row>
		<div class="vtech-row-main vtech-grid-2">
			<?php
			VTech_Admin::icon_field( "footer[socials][$i][icon]", $s['icon'], 'Icon' );
			VTech_Admin::text_field( "footer[socials][$i][url]", $s['url'], 'Link', '#' );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * A legal link row (label + url).
 */
function vtech_render_footer_legal( $i, $l ) {
	$l = wp_parse_args( $l, array( 'label' => '', 'url' => '' ) );
	?>
	<div class="vtech-row vtech-subrow" data-row>
		<div class="vtech-row-main vtech-grid-2">
			<?php
			VTech_Admin::text_field( "footer[legal][$i][label]", $l['label'], 'Label', 'Privacy Policy' );
			VTech_Admin::text_field( "footer[legal][$i][url]", $l['url'], 'Link', '#' );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}
