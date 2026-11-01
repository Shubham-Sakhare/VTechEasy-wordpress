<?php
/**
 * Page-builder admin.
 *
 * Each frontend page gets its own submenu. That screen is the single place to
 * edit everything the page shows:
 *   - the page Hero, and
 *   - the content of every reusable section.
 *
 * The "Sections" screen has a tab per page; reusable sections are enabled
 * there and ordered by drag-and-drop. The page hero is enabled by default and
 * remains at the top of the page.
 *
 * All forms are schema-driven (VTech_Schema), nonce-protected and capability
 * checked, so they stay in sync with the registry automatically.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VTech_PageBuilder {

	const CAP = 'manage_options';
	const STANDALONE_SECTIONS = array( 'process', 'testimonials', 'cta' );

	/**
	 * Boot: register submenus once sections exist.
	 */
	public static function init() {
		add_action( 'vtech_admin_submenus', array( __CLASS__, 'register_submenus' ), 30, 2 );
	}

	/**
	 * Register one submenu per page + the Sections manager.
	 *
	 * @param string $parent parent slug.
	 * @param string $cap    capability.
	 */
	public static function register_submenus( $parent, $cap ) {
		foreach ( VTech_Pages::all() as $slug => $page ) {
			add_submenu_page(
				$parent,
				$page['label'] . ' Page',
				$page['label'],
				$cap,
				'vtech-page-' . $slug,
				function () use ( $slug ) {
					VTech_PageBuilder::render_page_screen( $slug );
				}
			);
		}

		add_submenu_page(
			$parent,
			__( 'Case Study', 'vtech-core' ),
			__( 'Case Study', 'vtech-core' ),
			$cap,
			'vtech-case-study',
			array( __CLASS__, 'render_case_study_screen' )
		);

		foreach ( self::STANDALONE_SECTIONS as $section_id ) {
			$section = VTech_Sections::get( $section_id );
			if ( ! $section ) {
				continue;
			}
			add_submenu_page(
				$parent,
				$section['label'],
				$section['label'],
				$cap,
				'vtech-section-' . $section_id,
				function () use ( $section_id ) {
					VTech_PageBuilder::render_standalone_section_screen( $section_id );
				}
			);
		}

		add_submenu_page(
			$parent,
			__( 'Sections', 'vtech-core' ),
			__( 'Sections', 'vtech-core' ),
			$cap,
			'vtech-sections',
			array( __CLASS__, 'render_sections_screen' )
		);

	}

	/**
	 * Render an editor menu dedicated to one reusable section.
	 *
	 * @param string $section_id Section id.
	 */
	public static function render_standalone_section_screen( $section_id ) {
		$def = VTech_Sections::get( $section_id );
		if ( ! $def || ! in_array( $section_id, self::STANDALONE_SECTIONS, true ) || ! current_user_can( self::CAP ) ) {
			return;
		}

		if ( isset( $_POST['vtech_standalone_nonce'] ) ) {
			if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_standalone_nonce'] ), 'vtech_save_standalone_' . $section_id ) ) {
				wp_die( esc_html__( 'Security check failed. Please reload the page and try again.', 'vtech-core' ) );
			}
			$raw = isset( $_POST['section'][ $section_id ] ) && is_array( $_POST['section'][ $section_id ] )
				? wp_unslash( $_POST['section'][ $section_id ] )
				: array();
			$clean = VTech_Schema::sanitize( self::content_fields( $def ), $raw );
			$existing = vtech_get_section_content( $section_id );
			$clean['placement'] = isset( $existing['placement'] ) && is_array( $existing['placement'] )
				? $existing['placement']
				: ( isset( $def['defaults']['placement'] ) ? $def['defaults']['placement'] : array() );
			foreach ( array( 'parent_page', 'advanced' ) as $admin_key ) {
				if ( array_key_exists( $admin_key, $existing ) ) {
					$clean[ $admin_key ] = $existing[ $admin_key ];
				}
			}
			vtech_save_section_content( $section_id, $clean );
			add_settings_error( 'vtech_standalone_' . $section_id, 'saved', __( 'Section content saved.', 'vtech-core' ), 'success' );
		}

		$data = vtech_get_section_content( $section_id );
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons <?php echo esc_attr( $def['icon'] ); ?>"></span> <?php echo esc_html( $def['label'] ); ?></h1>
				<p class="vtech-sub">Edit this section here. Choose the pages where it appears and set its order in the Sections menu.</p>
			</div>
			<?php settings_errors( 'vtech_standalone_' . $section_id ); ?>
			<form method="post" class="vtech-form">
				<?php wp_nonce_field( 'vtech_save_standalone_' . $section_id, 'vtech_standalone_nonce' ); ?>
				<div class="vtech-panel vtech-section-block is-open">
					<div class="vtech-section-head">
						<h2 class="vtech-panel-title"><span class="dashicons <?php echo esc_attr( $def['icon'] ); ?>"></span> <?php echo esc_html( $def['label'] ); ?></h2>
						<div class="vtech-section-tools">
							<button type="button" class="vtech-collapse" aria-expanded="true" title="Collapse / expand"><span class="dashicons dashicons-arrow-down-alt2"></span></button>
						</div>
					</div>
					<div class="vtech-collapse-body">
					<div class="vtech-grid-2">
						<?php VTech_Schema::render( self::content_fields( $def ), 'section[' . $section_id . ']', $data ); ?>
					</div>
					</div>
				</div>
				<?php submit_button( 'Save ' . $def['label'] ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render and save the standalone Case Study editor.
	 */
	public static function render_case_study_screen() {
		$def = VTech_Sections::get( 'case_study' );
		if ( ! $def || ! current_user_can( self::CAP ) ) {
			return;
		}

		if ( isset( $_POST['vtech_case_study_nonce'] ) ) {
			if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_case_study_nonce'] ), 'vtech_save_case_study' ) ) {
				wp_die( esc_html__( 'Security check failed. Please reload the page and try again.', 'vtech-core' ) );
			}

			$raw      = isset( $_POST['section']['case_study'] ) && is_array( $_POST['section']['case_study'] )
				? wp_unslash( $_POST['section']['case_study'] )
				: array();
			$existing = vtech_get_section_content( 'case_study' );
			$clean    = VTech_Schema::sanitize( self::content_fields( $def ), $raw );
			$clean['placement'] = isset( $existing['placement'] ) && is_array( $existing['placement'] )
				? $existing['placement']
				: $def['defaults']['placement'];
			vtech_save_section_content( 'case_study', $clean );
			add_settings_error( 'vtech_case_study', 'saved', __( 'Case Study saved.', 'vtech-core' ), 'success' );
		}

		$data = vtech_get_section_content( 'case_study' );
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons dashicons-media-document"></span> Case Study</h1>
				<p class="vtech-sub">Edit the featured case study shown on the Portfolio page.</p>
			</div>
			<?php settings_errors( 'vtech_case_study' ); ?>
			<form method="post" class="vtech-form">
				<?php wp_nonce_field( 'vtech_save_case_study', 'vtech_case_study_nonce' ); ?>
				<div class="vtech-panel vtech-section-block is-open">
					<div class="vtech-section-head">
						<h2 class="vtech-panel-title"><span class="dashicons dashicons-media-document"></span> Case Study</h2>
						<div class="vtech-section-tools">
							<button type="button" class="vtech-collapse" aria-expanded="true" title="Collapse / expand"><span class="dashicons dashicons-arrow-down-alt2"></span></button>
						</div>
					</div>
					<div class="vtech-collapse-body">
					<div class="vtech-grid-2">
						<?php VTech_Schema::render( self::content_fields( $def ), 'section[case_study]', $data ); ?>
					</div>
					</div>
				</div>
				<?php submit_button( 'Save Case Study' ); ?>
			</form>
		</div>
		<?php
	}

	/* ---------------------------------------------------------------------
	 * Per-page screen (Hero + every reusable section's content)
	 * ------------------------------------------------------------------- */

	/**
	 * Render a single page's admin screen: its Hero editor followed by the
	 * content of every reusable section, each with an "Add to Feature" toggle
	 * and order that control whether it shows on THIS page.
	 *
	 * @param string $slug page slug.
	 */
	public static function render_page_screen( $slug ) {
		$page = VTech_Pages::get( $slug );
		if ( ! $page ) {
			return;
		}

		$hero_def = VTech_Sections::hero_for_page( $slug );

		// Handle saves (only the submitted form's fields are posted).
		if ( $hero_def && isset( $_POST['vtech_hero_nonce'] ) ) {
			self::save_hero( $hero_def );
		}
		if ( isset( $_POST['vtech_page_nonce'], $_POST['vtech_page_slug'] ) ) {
			self::save_page_sections( sanitize_key( wp_unslash( $_POST['vtech_page_slug'] ) ) );
		}

		$hero_data = $hero_def ? vtech_get_section_content( $hero_def['id'] ) : array();
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons dashicons-admin-page"></span> <?php echo esc_html( $page['label'] ); ?> Page</h1>
				<p class="vtech-sub">This page's own fields. To show a section on other pages or change its order, use the <strong>Sections</strong> menu. Route: <code><?php echo esc_html( $page['path'] ); ?></code></p>
			</div>

			<?php settings_errors( 'vtech_page' ); ?>
			<?php if ( $hero_def ) : ?>
				<form method="post" class="vtech-form">
					<?php wp_nonce_field( 'vtech_save_hero_' . $hero_def['id'], 'vtech_hero_nonce' ); ?>
					<input type="hidden" name="vtech_section_id" value="<?php echo esc_attr( $hero_def['id'] ); ?>" />

					<div class="vtech-panel vtech-section-block is-open">
					<div class="vtech-section-head">
						<h2 class="vtech-panel-title"><span class="dashicons <?php echo esc_attr( $hero_def['icon'] ); ?>"></span> <?php echo esc_html( $hero_def['label'] ); ?></h2>
						<div class="vtech-section-tools">
							<button type="button" class="vtech-collapse" aria-expanded="true" title="Collapse / expand"><span class="dashicons dashicons-arrow-down-alt2"></span></button>
						</div>
					</div>

					<div class="vtech-collapse-body">
					<div class="vtech-grid-2">
							<?php
							VTech_Schema::render(
								self::content_fields( $hero_def ),
								'section[' . $hero_def['id'] . ']',
								$hero_data
							);
							?>
						</div>
					</div>

					<?php submit_button( 'Save ' . $page['label'] . ' Hero' ); ?>
				</form>
			<?php else : ?>
				<div class="vtech-panel"><p>This page has no hero section registered.</p></div>
			<?php endif; ?>

			<div class="vtech-listbar">
				<span>Click a section title or the arrow to collapse / expand it.</span>
				<div class="vtech-listbar-actions">
					<button type="button" class="button vtech-expand-all">Expand All</button>
					<button type="button" class="button vtech-collapse-all">Collapse All</button>
				</div>
			</div>

			<form method="post" class="vtech-form">
				<?php wp_nonce_field( 'vtech_save_page_' . $slug, 'vtech_page_nonce' ); ?>
				<input type="hidden" name="vtech_page_slug" value="<?php echo esc_attr( $slug ); ?>" />

				<?php
				$own_sections = VTech_Sections::for_page( $slug );
				$i = 0;
				foreach ( $own_sections as $id => $def ) {
					if ( in_array( $id, self::STANDALONE_SECTIONS, true ) ) {
						continue;
					}
					++$i;
					self::render_page_section_block( $slug, $id, $def, $i );
				}
				if ( 0 === $i ) {
					echo '<div class="vtech-panel"><p>' . esc_html__( 'This page has no section of its own yet. Create one from the Sections screen and pick this page as its owner.', 'vtech-core' ) . '</p></div>';
				}
				?>

				<?php submit_button( 'Save ' . $page['label'] . ' Sections' ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * The content-only fields of a section (everything except the admin-only
	 * metadata that is managed on the Sections screen).
	 *
	 * @param array $def section definition.
	 * @return array schema.
	 */
	private static function content_fields( array $def ) {
		$fields = isset( $def['fields'] ) ? $def['fields'] : array();
		unset( $fields['placement'], $fields['parent_page'], $fields['advanced'] );
		return $fields;
	}

	/**
	 * The admin-only fields of a section (advanced settings + parent page).
	 * These are edited from the Sections screen, never from a page's menu.
	 *
	 * @param array $def section definition.
	 * @return array schema.
	 */
	private static function admin_fields( array $def ) {
		$fields = isset( $def['fields'] ) ? $def['fields'] : array();
		$out    = array();
		foreach ( array( 'parent_page', 'advanced' ) as $key ) {
			if ( isset( $fields[ $key ] ) ) {
				$out[ $key ] = $fields[ $key ];
			}
		}
		return $out;
	}

	/**
	 * Sanitize a raw page visibility map.
	 *
	 * @param array $raw raw placement rows (page slug => [show]).
	 * @return array clean placement map limited to known pages.
	 */
	private static function sanitize_placement( $raw ) {
		$raw  = is_array( $raw ) ? $raw : array();
		$out  = array();
		foreach ( $raw as $slug => $row ) {
			$slug = sanitize_key( $slug );
			if ( '' === $slug || ! VTech_Pages::exists( $slug ) || ! is_array( $row ) ) {
				continue;
			}
			$out[ $slug ] = array(
				'show'  => ! empty( $row['show'] ) ? 1 : 0,
				'order' => 0,
			);
		}
		return $out;
	}

	/**
	 * Render one reusable section's content fields on its owner page.
	 *
	 * @param string $slug page slug.
	 * @param string $id   section id.
	 * @param array  $def  section definition.
	 * @param int    $num  position number shown as a badge.
	 */
	private static function render_page_section_block( $slug, $id, array $def, $num = 0 ) {
		$data  = vtech_get_section_content( $id );
		if ( 'contact_content' === $id && ! isset( $data['form']['fields'] ) ) {
			$data['form']['fields'] = array_map(
				function ( $field ) {
					if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
						$field['options'] = implode( "\n", $field['options'] );
					}
					return $field;
				},
				vtech_contact_form_fields()
			);
		}

		$base      = 'section[' . $id . ']';
		$fields    = self::content_fields( $def );
		?>
		<div class="vtech-panel vtech-section-block is-on is-open">
			<div class="vtech-section-head">
				<h2 class="vtech-panel-title"><?php if ( $num ) : ?><span class="vtech-count"><?php echo esc_html( $num ); ?></span><?php endif; ?><span class="dashicons <?php echo esc_attr( $def['icon'] ); ?>"></span> <?php echo esc_html( $def['label'] ); ?></h2>
				<div class="vtech-section-tools">
					<button type="button" class="vtech-collapse" aria-expanded="true" title="Collapse / expand"><span class="dashicons dashicons-arrow-down-alt2"></span></button>
				</div>
			</div>

			<div class="vtech-collapse-body">
			<div class="vtech-grid-2">
				<?php
				if ( empty( $fields ) ) {
					echo '<p class="vtech-hint">This section has no content fields.</p>';
				} else {
					VTech_Schema::render( $fields, $base, $data );
				}
				?>
			</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Save a hero section (schema-driven + secured).
	 *
	 * @param array $def hero section definition.
	 */
	private static function save_hero( array $def ) {
		if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_hero_nonce'] ), 'vtech_save_hero_' . $def['id'] ) ) {
			return;
		}
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		$raw = isset( $_POST['section'][ $def['id'] ] ) ? wp_unslash( $_POST['section'][ $def['id'] ] ) : array();

		// Only the content fields are rendered on the page menu, so sanitize
		// against those and carry over any admin-only values already stored.
		$clean = VTech_Schema::sanitize( self::content_fields( $def ), $raw );
		$existing = vtech_get_section_content( $def['id'] );
		foreach ( array( 'parent_page', 'advanced' ) as $admin_key ) {
			if ( array_key_exists( $admin_key, $existing ) ) {
				$clean[ $admin_key ] = $existing[ $admin_key ];
			}
		}

		vtech_save_section_content( $def['id'], $clean );
		add_settings_error( 'vtech_page', 'saved', __( 'Saved.', 'vtech-core' ), 'success' );
	}

	/**
	 * Save the reusable sections posted from a page's menu. Sections belonging
	 * to other page forms are not submitted and must remain unchanged.
	 *
	 * @param string $slug page slug.
	 */
	private static function save_page_sections( $slug ) {
		if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_page_nonce'] ), 'vtech_save_page_' . $slug ) ) {
			return;
		}
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		foreach ( VTech_Sections::in_group( 'reusable' ) as $id => $def ) {
			if ( ! isset( $_POST['section'][ $id ] ) || ! is_array( $_POST['section'][ $id ] ) ) {
				continue;
			}
			$raw = wp_unslash( $_POST['section'][ $id ] );

			$existing = vtech_get_section_content( $id );
			if (
				in_array( $id, array( 'projects', 'services' ), true )
				&& isset( $raw['items'], $existing['items'] )
				&& is_array( $raw['items'] )
				&& is_array( $existing['items'] )
			) {
				foreach ( $raw['items'] as $index => &$item ) {
					if (
						is_array( $item )
						&& ! array_key_exists( 'detail_content', $item )
						&& isset( $existing['items'][ $index ]['detail_content'] )
					) {
						$item['detail_content'] = $existing['items'][ $index ]['detail_content'];
					}
				}
				unset( $item );
			}
			$clean = VTech_Schema::sanitize( self::content_fields( $def ), $raw );
			if ( in_array( $id, array( 'projects', 'services' ), true ) && isset( $raw['items'], $clean['items'] ) && is_array( $raw['items'] ) && is_array( $clean['items'] ) ) {
				foreach ( $raw['items'] as $index => $item ) {
					if ( is_array( $item ) && array_key_exists( 'detail_content', $item ) && isset( $clean['items'][ $index ] ) ) {
						$clean['items'][ $index ]['detail_content'] = wp_kses_post( (string) $item['detail_content'] );
					}
				}
			}
			foreach ( array( 'parent_page', 'advanced' ) as $admin_key ) {
				if ( array_key_exists( $admin_key, $existing ) ) {
					$clean[ $admin_key ] = $existing[ $admin_key ];
				}
			}

			// Merge placement rows posted from this page + the extra-pages grid.
			$placement = isset( $existing['placement'] ) && is_array( $existing['placement'] ) ? $existing['placement'] : array();
			if ( isset( $raw['placement'] ) ) {
				$placement = array_merge( $placement, self::sanitize_placement( $raw['placement'] ) );
			}
			$clean['placement'] = $placement;

			vtech_save_section_content( $id, $clean );
		}

		add_settings_error( 'vtech_page', 'saved', __( 'Saved.', 'vtech-core' ), 'success' );
	}

	/* ---------------------------------------------------------------------
	 * Page-first Sections manager and legacy advanced editor.
	 * ------------------------------------------------------------------- */

	/**
	 * Render the page-first Sections manager and the editor for existing sections.
	 */
	public static function render_sections_screen() {
		$pages       = VTech_Pages::all();
		$active_page = isset( $_GET['vtech_page_tab'] ) ? sanitize_key( wp_unslash( $_GET['vtech_page_tab'] ) ) : 'home';
		if ( ! isset( $pages[ $active_page ] ) ) {
			$active_page = key( $pages );
		}
		$manage = isset( $_GET['section'] );
		if ( ! $manage ) {
			$saved = false;
			if ( isset( $_POST['vtech_page_layout_nonce'] ) ) {
				if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_page_layout_nonce'] ), 'vtech_save_page_layout' ) ) {
					wp_die( esc_html__( 'Security check failed. Please reload the page and try again.', 'vtech-core' ) );
				}
				if ( ! current_user_can( self::CAP ) ) {
					wp_die( esc_html__( 'You are not allowed to change page layouts.', 'vtech-core' ) );
				}
				$posted_page = isset( $_POST['vtech_layout_page'] ) ? sanitize_key( wp_unslash( $_POST['vtech_layout_page'] ) ) : '';
				if ( ! isset( $pages[ $posted_page ] ) ) {
					wp_die( esc_html__( 'The selected page is invalid.', 'vtech-core' ) );
				}
				self::save_page_layout( $posted_page );
				$active_page = $posted_page;
				$saved       = true;
			}

			$sections = VTech_Sections::in_group( 'reusable' );
			?>
			<div class="wrap vtech-wrap">
				<div class="vtech-head">
					<h1><span class="dashicons dashicons-screenoptions"></span> Sections</h1>
					<p class="vtech-sub">Choose a page, enable sections, and drag them into the order you want. Edit section content from its page menu.</p>
				</div>
				<?php if ( $saved ) : ?>
					<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Page layout saved.', 'vtech-core' ); ?></p></div>
				<?php endif; ?>
				<h2 class="nav-tab-wrapper vtech-tabs vtech-page-tabs">
					<?php foreach ( $pages as $slug => $page ) : ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=vtech-sections&vtech_page_tab=' . $slug ) ); ?>" class="nav-tab <?php echo $slug === $active_page ? 'nav-tab-active' : ''; ?>"><?php echo esc_html( $page['label'] ); ?></a>
					<?php endforeach; ?>
				</h2>
				<?php self::render_page_layout_manager( $active_page, $pages[ $active_page ], $sections ); ?>
			</div>
			<?php
			return;
		}

		// Persist edits to the selected reusable section.
		if ( isset( $_POST['vtech_section_nonce'], $_POST['vtech_section_id'] ) ) {
			$id = sanitize_key( wp_unslash( $_POST['vtech_section_id'] ) );
			self::save_reusable( $id );
		}

		$sections = VTech_Sections::in_group( 'reusable' );
		$active   = isset( $_GET['section'] ) ? sanitize_key( wp_unslash( $_GET['section'] ) ) : key( $sections );
		if ( ! isset( $sections[ $active ] ) ) {
			$active = key( $sections );
		}
		?>
		<div class="wrap vtech-wrap">
			<div class="vtech-head">
				<h1><span class="dashicons dashicons-screenoptions"></span> Sections — Advanced</h1>
				<p class="vtech-sub">Choose which sections appear on each page and set their order. Edit section content from its page menu.</p>
			</div>

			<?php settings_errors( 'vtech_section' ); ?>

			<h2 class="nav-tab-wrapper vtech-tabs">
				<?php
				foreach ( $sections as $id => $def ) {
					printf(
						'<a href="%1$s" class="nav-tab %2$s"><span class="dashicons %3$s"></span> %4$s</a>',
						esc_url( admin_url( 'admin.php?page=vtech-sections&section=' . $id ) ),
						$id === $active ? 'nav-tab-active' : '',
						esc_attr( $def['icon'] ),
						esc_html( $def['label'] )
					);
				}
				?>
			</h2>

			<?php
			if ( isset( $sections[ $active ] ) ) {
				self::render_section_advanced( $active, $sections[ $active ] );
			}
			?>
		</div>
		<?php
	}

	/**
	 * Render page layout controls with a fixed hero and sortable reusable sections.
	 *
	 * @param string $page_slug Page slug.
	 * @param array  $page      Page data.
	 * @param array  $sections  Reusable sections.
	 */
	private static function render_page_layout_manager( $page_slug, array $page, array $sections ) {
		$hero_def  = VTech_Sections::hero_for_page( $page_slug );
		$hero_data = $hero_def ? vtech_get_section_content( $hero_def['id'] ) : array();
		$hero_on   = ! isset( $hero_data['advanced']['visible'] ) || ! empty( $hero_data['advanced']['visible'] );
		$rows      = array();
		$cta_data  = isset( $sections['cta'] ) ? vtech_get_section_content( 'cta' ) : array();
		$cta_place = isset( $cta_data['placement'][ $page_slug ] ) ? $cta_data['placement'][ $page_slug ] : array();
		foreach ( $sections as $id => $def ) {
			if ( in_array( $id, array( 'cta', 'blog_content' ), true ) ) {
				continue;
			}
			$data      = vtech_get_section_content( $id );
			$placement = isset( $data['placement'][ $page_slug ] ) && is_array( $data['placement'][ $page_slug ] )
				? $data['placement'][ $page_slug ]
				: array();
			$rows[] = array(
				'id'      => $id,
				'label'   => $def['label'],
				'icon'    => $def['icon'],
				'enabled' => ! empty( $placement['show'] ),
				'order'   => isset( $placement['order'] ) ? (int) $placement['order'] : PHP_INT_MAX,
			);
		}
		usort(
			$rows,
			function ( $a, $b ) {
				if ( $a['enabled'] !== $b['enabled'] ) {
					return $a['enabled'] ? -1 : 1;
				}
				if ( $a['order'] !== $b['order'] ) {
					return $a['order'] < $b['order'] ? -1 : 1;
				}
				return strcasecmp( $a['label'], $b['label'] );
			}
		);
		?>
		<div class="vtech-layout-intro">
			<div>
				<h2><?php echo esc_html( $page['label'] ); ?> page sections</h2>
				<p>Drag the handle to reorder. The hero stays at the top and is enabled by default.</p>
			</div>
		</div>
		<form method="post" class="vtech-form vtech-layout-form">
			<?php wp_nonce_field( 'vtech_save_page_layout', 'vtech_page_layout_nonce' ); ?>
			<input type="hidden" name="vtech_layout_page" value="<?php echo esc_attr( $page_slug ); ?>" />
			<?php if ( $hero_def ) : ?>
				<div class="vtech-page-layout-row vtech-hero-layout-row">
					<span class="dashicons <?php echo esc_attr( $hero_def['icon'] ); ?> vtech-layout-icon"></span>
					<div class="vtech-layout-name">
						<strong><?php echo esc_html( $hero_def['label'] ); ?></strong>
						<span>Hero — always at the top of this page</span>
					</div>
					<label class="vtech-layout-toggle" aria-label="Enable page hero">
						<input type="checkbox" name="vtech_hero_enabled" value="1" <?php checked( $hero_on ); ?> />
						<span class="vtech-slider"></span>
					</label>
				</div>
			<?php endif; ?>
			<?php if ( $rows ) : ?>
				<ul class="vtech-page-section-list">
					<?php foreach ( $rows as $row ) : ?>
						<li class="vtech-page-layout-row vtech-page-section-row">
							<span class="dashicons dashicons-menu vtech-page-section-drag" aria-hidden="true"></span>
							<input type="hidden" name="vtech_section_order[]" value="<?php echo esc_attr( $row['id'] ); ?>" />
							<span class="dashicons <?php echo esc_attr( $row['icon'] ); ?> vtech-layout-icon"></span>
							<div class="vtech-layout-name">
								<strong><?php echo esc_html( $row['label'] ); ?></strong>
							</div>
							<label class="vtech-layout-toggle" aria-label="<?php echo esc_attr( 'Enable ' . $row['label'] ); ?>">
								<input type="checkbox" name="vtech_section_enabled[<?php echo esc_attr( $row['id'] ); ?>]" value="1" <?php checked( $row['enabled'] ); ?> />
								<span class="vtech-slider"></span>
							</label>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php else : ?>
				<div class="vtech-panel"><p>No reusable sections are registered yet.</p></div>
			<?php endif; ?>
			<?php if ( isset( $sections['cta'] ) ) : ?>
				<div class="vtech-page-layout-row vtech-hero-layout-row">
					<span class="dashicons <?php echo esc_attr( $sections['cta']['icon'] ); ?> vtech-layout-icon"></span>
					<div class="vtech-layout-name">
						<strong><?php echo esc_html( $sections['cta']['label'] ); ?></strong>
						<span>Shown above the footer</span>
					</div>
					<label class="vtech-layout-toggle" aria-label="Enable CTA Band">
						<input type="checkbox" name="vtech_section_enabled[cta]" value="1" <?php checked( ! empty( $cta_place['show'] ) ); ?> />
						<span class="vtech-slider"></span>
					</label>
				</div>
			<?php endif; ?>
			<div class="vtech-actions"><?php submit_button( 'Save ' . $page['label'] . ' Layout', 'primary', 'submit', false ); ?></div>
		</form>
		<?php
	}

	/**
	 * Persist visibility and order for one page without changing other pages.
	 *
	 * @param string $page_slug Page slug.
	 */
	private static function save_page_layout( $page_slug ) {
		$registered = VTech_Sections::in_group( 'reusable' );
		$submitted  = isset( $_POST['vtech_section_order'] ) && is_array( $_POST['vtech_section_order'] )
			? array_map( 'sanitize_key', wp_unslash( $_POST['vtech_section_order'] ) )
			: array();
		$enabled = isset( $_POST['vtech_section_enabled'] ) && is_array( $_POST['vtech_section_enabled'] )
			? wp_unslash( $_POST['vtech_section_enabled'] )
			: array();
		$order = array();
		foreach ( $submitted as $id ) {
			if ( isset( $registered[ $id ] ) && ! in_array( $id, array( 'cta', 'blog_content' ), true ) && ! in_array( $id, $order, true ) ) {
				$order[] = $id;
			}
		}
		foreach ( $registered as $id => $def ) {
			if ( in_array( $id, array( 'cta', 'blog_content' ), true ) ) {
				continue;
			}
			if ( ! in_array( $id, $order, true ) ) {
				$order[] = $id;
			}
		}

		foreach ( $order as $index => $id ) {
			$data = vtech_get_section_content( $id );
			if ( ! isset( $data['placement'] ) || ! is_array( $data['placement'] ) ) {
				$data['placement'] = array();
			}
			$data['placement'][ $page_slug ] = array(
				'show'  => isset( $enabled[ $id ] ) && self::posted_toggle_is_enabled( $enabled[ $id ] ) ? 1 : 0,
				'order' => ( $index + 1 ) * 10,
			);
			vtech_save_section_content( $id, $data );
		}
		if ( isset( $registered['cta'] ) ) {
			$cta_data = vtech_get_section_content( 'cta' );
			if ( ! isset( $cta_data['placement'] ) || ! is_array( $cta_data['placement'] ) ) {
				$cta_data['placement'] = array();
			}
			$cta_data['placement'][ $page_slug ] = array(
				'show'  => isset( $enabled['cta'] ) && self::posted_toggle_is_enabled( $enabled['cta'] ) ? 1 : 0,
				'order' => ( count( $order ) + 1 ) * 10,
			);
			vtech_save_section_content( 'cta', $cta_data );
		}

		$hero_def = VTech_Sections::hero_for_page( $page_slug );
		if ( $hero_def ) {
			$hero_data = vtech_get_section_content( $hero_def['id'] );
			if ( ! isset( $hero_data['advanced'] ) || ! is_array( $hero_data['advanced'] ) ) {
				$hero_data['advanced'] = array();
			}
			$hero_data['advanced']['visible'] = isset( $_POST['vtech_hero_enabled'] ) && self::posted_toggle_is_enabled( wp_unslash( $_POST['vtech_hero_enabled'] ) ) ? 1 : 0;
			vtech_save_section_content( $hero_def['id'], $hero_data );
		}
	}

	/**
	 * Read a posted switch value, including older hidden-input + checkbox arrays.
	 *
	 * @param mixed $value Posted value.
	 * @return bool
	 */
	private static function posted_toggle_is_enabled( $value ) {
		if ( is_array( $value ) ) {
			$value = end( $value );
		}
		return '1' === (string) $value;
	}

	/**
	 * The advanced editor for a reusable section: its advanced options and
	 * the pages it shows on.
	 *
	 * @param string $id  section id.
	 * @param array  $def section definition.
	 */
	private static function render_section_advanced( $id, array $def ) {
		$data         = vtech_get_section_content( $id );
		$admin_schema = self::admin_fields( $def );
		$placement    = isset( $data['placement'] ) && is_array( $data['placement'] ) ? $data['placement'] : array();
		?>
		<form method="post" class="vtech-form">
			<?php wp_nonce_field( 'vtech_save_section_' . $id, 'vtech_section_nonce' ); ?>
			<input type="hidden" name="vtech_section_id" value="<?php echo esc_attr( $id ); ?>" />

			<div class="vtech-panel">
				<h2 class="vtech-panel-title"><?php echo esc_html( $def['label'] ); ?> — Advanced</h2>
				<?php if ( empty( $admin_schema ) ) : ?>
					<p class="vtech-hint">This section has no advanced options. Its content is edited from each page's menu.</p>
				<?php else : ?>
					<div class="vtech-grid-2">
						<?php VTech_Schema::render( $admin_schema, 'section[' . $id . ']', $data ); ?>
					</div>
				<?php endif; ?>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Show on Pages</h2>
				<p class="vtech-hint">Enable this section on any page. Drag it on the Sections page to set its order.</p>
				<?php self::render_placement_grid( 'section[' . $id . ']', $placement ); ?>
			</div>

			<div class="vtech-actions">
				<?php submit_button( 'Save ' . $def['label'], 'primary', 'submit' ); ?>
			</div>
		</form>
		<?php
	}

	/**
	 * Render page visibility controls.
	 *
	 * @param string $base      name prefix, e.g. "section[services]".
	 * @param array  $placement stored placement map (page slug => [show, order]).
	 * @param string $skip      optional page slug to leave out (owned by a
	 *                          toggle rendered above the grid).
	 */
	private static function render_placement_grid( $base, $placement, $skip = '' ) {
		$placement = is_array( $placement ) ? $placement : array();
		?>
		<table class="vtech-placement">
			<thead><tr><th>Page</th><th>Show</th></tr></thead>
			<tbody>
			<?php
			foreach ( VTech_Pages::all() as $slug => $page ) {
				if ( $skip && $slug === $skip ) {
					continue;
				}
				$row   = isset( $placement[ $slug ] ) && is_array( $placement[ $slug ] ) ? $placement[ $slug ] : array( 'show' => 0, 'order' => 0 );
				$show  = ! empty( $row['show'] );
				$rbase = $base . '[placement][' . $slug . ']';
				?>
				<tr>
					<td><strong><?php echo esc_html( $page['label'] ); ?></strong><br><code><?php echo esc_html( $page['path'] ); ?></code></td>
					<td>
						<span class="vtech-switch">
							<input type="hidden" name="<?php echo esc_attr( $rbase ); ?>[show]" value="0" />
							<input type="checkbox" name="<?php echo esc_attr( $rbase ); ?>[show]" value="1" <?php checked( $show ); ?> />
							<span class="vtech-slider"></span>
						</span>
					</td>
				</tr>
				<?php
			}
			?>
			</tbody>
		</table>
		<?php
	}

	/**
	 * Save a reusable section's advanced options + placement from the Sections
	 * screen. Content fields are owned by the page menus and are preserved.
	 *
	 * @param string $id section id.
	 */
	private static function save_reusable( $id ) {
		$def = VTech_Sections::get( $id );
		if ( ! $def || 'reusable' !== $def['group'] ) {
			return;
		}
		if ( ! wp_verify_nonce( wp_unslash( $_POST['vtech_section_nonce'] ), 'vtech_save_section_' . $id ) ) {
			return;
		}
		if ( ! current_user_can( self::CAP ) ) {
			return;
		}

		$raw      = isset( $_POST['section'][ $id ] ) && is_array( $_POST['section'][ $id ] ) ? wp_unslash( $_POST['section'][ $id ] ) : array();
		$existing = vtech_get_section_content( $id );

		// Only the advanced options are edited on this screen.
		$clean = VTech_Schema::sanitize( self::admin_fields( $def ), $raw );

		// Keep the content that lives on the page menus.
		foreach ( self::content_fields( $def ) as $key => $field ) {
			$clean[ $key ] = array_key_exists( $key, $existing ) ? $existing[ $key ] : VTech_Schema::field_default( $field );
		}

		// Placement comes from the full grid here (every page is posted).
		if ( isset( $raw['placement'] ) ) {
			$clean['placement'] = self::sanitize_placement( $raw['placement'] );
			foreach ( $clean['placement'] as $slug => $row ) {
				$clean['placement'][ $slug ]['order'] = isset( $existing['placement'][ $slug ]['order'] )
					? (int) $existing['placement'][ $slug ]['order']
					: 0;
			}
		} elseif ( isset( $existing['placement'] ) ) {
			$clean['placement'] = $existing['placement'];
		}

		vtech_save_section_content( $id, $clean );
		add_settings_error( 'vtech_section', 'saved', __( 'Saved.', 'vtech-core' ), 'success' );
	}
}

add_action(
	'plugins_loaded',
	function () {
		VTech_PageBuilder::init();
	}
);
