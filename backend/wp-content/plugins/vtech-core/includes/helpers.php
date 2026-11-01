<?php
/**
 * Shared helpers + data access for VTech Core.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the full layout content array (header + footer + ...).
 *
 * @return array
 */
function vtech_get_content() {
	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) ) {
		$content = array();
	}

	$defaults = vtech_core_default_content();

	// Merge in section-registry defaults under 'sections' (added later than
	// the header/footer defaults, so only present once the registry has run).
	if ( class_exists( 'VTech_Sections' ) ) {
		$defaults['sections'] = VTech_Sections::defaults();
	}

	$content = wp_parse_args( $content, $defaults );

	// Ensure each registered section resolves even if stored partially.
	if ( class_exists( 'VTech_Sections' ) ) {
		$stored_sections         = isset( $content['sections'] ) && is_array( $content['sections'] ) ? $content['sections'] : array();
		$content['sections']     = array();
		foreach ( VTech_Sections::all() as $id => $def ) {
			$content['sections'][ $id ] = isset( $stored_sections[ $id ] ) && is_array( $stored_sections[ $id ] )
				? wp_parse_args( $stored_sections[ $id ], $def['defaults'] )
				: $def['defaults'];
		}
	}

	return $content;
}

/**
 * Get the settings used by public forms and the frontend REST API.
 *
 * @return array
 */
function vtech_core_settings() {
	$settings = get_option( 'vtech_core_settings', array() );
	if ( ! is_array( $settings ) ) {
		$settings = array();
	}

	return wp_parse_args(
		$settings,
		array(
			'notification_email' => 'vtecheasy@gmail.com',
			'frontend_origin'    => '',
		)
	);
}

/**
 * Normalize a frontend origin to scheme + host + optional port.
 *
 * @param string $value submitted origin.
 * @return string
 */
function vtech_sanitize_origin( $value ) {
	if ( ! is_string( $value ) ) {
		return '';
	}
	$value = trim( $value );
	if ( '' === $value ) {
		return '';
	}

	$parts = wp_parse_url( $value );
	if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || empty( $parts['host'] ) ) {
		return '';
	}

	if ( ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ||
		isset( $parts['user'] ) || isset( $parts['pass'] ) ||
		( isset( $parts['path'] ) && '/' !== $parts['path'] ) ||
		isset( $parts['query'] ) || isset( $parts['fragment'] ) ) {
		return '';
	}

	$origin = strtolower( $parts['scheme'] ) . '://' . strtolower( $parts['host'] );
	if ( isset( $parts['port'] ) ) {
		$origin .= ':' . (int) $parts['port'];
	}

	return $origin;
}

/**
 * Save a single top-level section's content, leaving the rest untouched.
 *
 * @param string $section header|footer.
 * @param array  $data    sanitized section data.
 */
function vtech_save_section( $section, $data ) {
	$content             = vtech_get_content();
	$content[ $section ] = $data;
	update_option( VTECH_CORE_OPTION, $content );
}

/**
 * Read one registry section's stored content (merged with its defaults).
 *
 * @param string $id section id.
 * @return array
 */
function vtech_get_section_content( $id ) {
	$content = vtech_get_content();
	return isset( $content['sections'][ $id ] ) ? $content['sections'][ $id ] : array();
}

/**
 * Save one registry section's content under content['sections'][id].
 *
 * @param string $id   section id.
 * @param array  $data sanitized data.
 */
function vtech_save_section_content( $id, $data ) {
	$content = vtech_get_content();
	if ( ! isset( $content['sections'] ) || ! is_array( $content['sections'] ) ) {
		$content['sections'] = array();
	}
	$content['sections'][ $id ] = $data;
	update_option( VTECH_CORE_OPTION, $content );
}

/**
 * The shared "placement" schema fragment every reusable section includes.
 * `show_on` is a per-page toggle+order map so one section can appear on many
 * pages, each with its own order. Pages come from the live Pages registry so
 * new pages appear automatically.
 *
 * Stored shape:
 *   placement => array(
 *     'home'  => array( 'show' => 1, 'order' => 2 ),
 *     'about' => array( 'show' => 0, 'order' => 0 ),
 *     ...
 *   )
 *
 * @return array schema fragment (single 'placement' group of per-page rows).
 */
function vtech_placement_schema() {
	$fields = array();
	foreach ( VTech_Pages::all() as $slug => $page ) {
		$fields[ $slug ] = array(
			'type'   => 'group',
			'label'  => $page['label'],
			'fields' => array(
				'show'  => array( 'type' => 'toggle', 'label' => 'Show on ' . $page['label'] ),
				'order' => array( 'type' => 'number', 'label' => 'Order', 'default' => 0 ),
			),
		);
	}
	return array(
		'placement' => array(
			'type'   => 'group',
			'label'  => 'Show on Pages & Order',
			'fields' => $fields,
		),
	);
}



/**
 * Resolve reusable sections for a page, sorted by placement order.
 *
 * Parent pages show all cards.
 * Secondary pages show only featured cards when a parent is configured.
 *
 * @param string $page_slug Page slug.
 * @return array
 */
function vtech_sections_for_page( $page_slug ) {
	$content = vtech_get_content();
	$out     = array();

	/**
	 * Normalize checkbox/toggle values.
	 *
	 * @param mixed $value Value to check.
	 * @return bool
	 */
	$is_enabled = function ( $value ) {
		if ( true === $value || 1 === $value ) {
			return true;
		}

		if ( ! is_scalar( $value ) ) {
			return false;
		}

		return in_array(
			strtolower( trim( (string) $value ) ),
			array( '1', 'true', 'on', 'yes' ),
			true
		);
	};

	/**
	 * Check the different feature flag names used by card fields.
	 *
	 * @param array $item Card data.
	 * @return bool
	 */
	$is_featured = function ( $item ) use ( $is_enabled ) {
		if ( ! is_array( $item ) ) {
			return false;
		}

		$feature_keys = array(
			'feature',
			'featured',
			'add_to_feature',
			'add_to_featured',
			'is_featured',
		);

		foreach ( $feature_keys as $key ) {
			if (
				array_key_exists( $key, $item ) &&
				$is_enabled( $item[ $key ] )
			) {
				return true;
			}
		}

		return false;
	};

	foreach ( VTech_Sections::in_group( 'reusable' ) as $id => $def ) {
		$data = isset( $content['sections'][ $id ] )
			? $content['sections'][ $id ]
			: $def['defaults'];

		/*
		 * Check whether this section is enabled on the requested page.
		 */
		$placement = isset( $data['placement'][ $page_slug ] )
			&& is_array( $data['placement'][ $page_slug ] )
				? $data['placement'][ $page_slug ]
				: array();

		if (
			! isset( $placement['show'] ) ||
			! $is_enabled( $placement['show'] )
		) {
			continue;
		}

		/*
		 * Determine the section's parent page.
		 */
		$parent_page = isset( $data['parent_page'] )
			? sanitize_key( (string) $data['parent_page'] )
			: '';

		$is_parent = (
			'' === $parent_page ||
			$page_slug === $parent_page
		);

		$render = $data;

		/*
		 * These fields are admin-only and must not be sent to React.
		 */
		unset(
			$render['placement'],
			$render['parent_page']
		);

		/*
		 * Ensure contact form fields are available.
		 */
		if (
			'contact_content' === $id &&
			(
				! isset( $render['form'] ) ||
				! is_array( $render['form'] ) ||
				! isset( $render['form']['fields'] )
			)
		) {
			$render['form']['fields'] = vtech_contact_form_fields();
		}

		/*
		 * Featured blog cards are loaded from blog_content.
		 */
		if ( 'featured_blogs' === $id ) {
			$blog_content = vtech_get_section_content( 'blog_content' );

			$posts = isset( $blog_content['posts'] )
				&& is_array( $blog_content['posts'] )
					? $blog_content['posts']
					: array();

			$render['items'] = array_values(
				array_filter(
					$posts,
					function ( $post ) use ( $is_featured, $is_enabled ) {
						if ( ! is_array( $post ) ) {
							return false;
						}

						$is_published = (
							! array_key_exists( 'published', $post ) ||
							$is_enabled( $post['published'] )
						);

						return $is_published && $is_featured( $post );
					}
				)
			);

			if ( empty( $render['items'] ) ) {
				continue;
			}
		}

		/*
		 * On secondary pages, only featured cards are shown when
		 * the section has an explicitly configured parent page.
		 *
		 * Sections without a parent page retain their existing behavior.
		 */
		/*
		 * Card lists live under different keys per section: most use `items`,
		 * while the team section uses `members`. Filter whichever is present.
		 */
		$card_keys = array( 'items', 'members' );

		if ( ! $is_parent && 'featured_blogs' !== $id ) {
			foreach ( $card_keys as $card_key ) {
				if ( ! isset( $render[ $card_key ] ) || ! is_array( $render[ $card_key ] ) ) {
					continue;
				}

				$render[ $card_key ] = array_values(
					array_filter(
						$render[ $card_key ],
						$is_featured
					)
				);

				/*
				 * Do not return an empty section.
				 */
				if ( empty( $render[ $card_key ] ) ) {
					continue 2;
				}
			}
		}

		/*
		 * Remove internal feature flags from the public API response.
		 */
		foreach ( $card_keys as $card_key ) {
			if ( ! isset( $render[ $card_key ] ) || ! is_array( $render[ $card_key ] ) ) {
				continue;
			}

			foreach ( $render[ $card_key ] as $index => $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}

				unset(
					$render[ $card_key ][ $index ]['feature'],
					$render[ $card_key ][ $index ]['featured'],
					$render[ $card_key ][ $index ]['add_to_feature'],
					$render[ $card_key ][ $index ]['add_to_featured'],
					$render[ $card_key ][ $index ]['is_featured']
				);
			}
		}

		$out[] = array(
			'type'        => $id,
			'order'       => isset( $placement['order'] )
				? (int) $placement['order']
				: 0,
			'data'        => $render,
			'page'        => $page_slug,
			'is_parent'   => $is_parent,
			'parent_page' => $parent_page,
		);
	}

	/*
	 * Sort sections by their configured page order.
	 */
	usort(
		$out,
		function ( $a, $b ) {
			if ( $a['order'] === $b['order'] ) {
				return 0;
			}

			return $a['order'] < $b['order'] ? -1 : 1;
		}
	);

	return $out;
}

/**
 * Get a page's hero data (section registered in group 'hero' for that page).
 *
 * @param string $page_slug page slug.
 * @return array|null hero data (without internal keys) or null.
 */
function vtech_hero_for_page( $page_slug ) {
	$def = VTech_Sections::hero_for_page( $page_slug );
	if ( ! $def ) {
		return null;
	}
	$content = vtech_get_content();
	$data    = isset( $content['sections'][ $def['id'] ] ) ? $content['sections'][ $def['id'] ] : $def['defaults'];

	return vtech_normalize_hero_data( is_array( $data ) ? $data : array() );
}

/**
 * Normalize a stored hero into the slider shape expected by the frontend.
 *
 * Guarantees `slides` is a non-empty array (migrating legacy flat heroes that
 * stored the slide fields at the top level into `slides[0]`), and that the
 * `slider` behaviour group and `advanced` group always exist.
 *
 * @param array $data raw stored hero data.
 * @return array
 */
function vtech_normalize_hero_data( array $data ) {
	$slide_keys = array( 'eyebrow', 'title', 'accent', 'title_end', 'description', 'image', 'note', 'points', 'primary', 'secondary' );

	$slides = isset( $data['slides'] ) && is_array( $data['slides'] )
		? array_values( array_filter( $data['slides'], 'is_array' ) )
		: array();

	// Legacy migration: no slides array but flat slide fields present.
	if ( empty( $slides ) ) {
		$legacy = array();
		foreach ( $slide_keys as $k ) {
			if ( isset( $data[ $k ] ) ) {
				$legacy[ $k ] = $data[ $k ];
			}
		}
		if ( ! empty( $legacy ) ) {
			$slides = array( $legacy );
		}
	}

	$data['slides']   = $slides;
	$data['slider']   = isset( $data['slider'] ) && is_array( $data['slider'] )
		? array_merge( array( 'autoplay' => 1, 'interval' => 6000, 'loop' => 1, 'arrows' => 1, 'dots' => 1 ), $data['slider'] )
		: array( 'autoplay' => 1, 'interval' => 6000, 'loop' => 1, 'arrows' => 1, 'dots' => 1 );
	$data['advanced'] = isset( $data['advanced'] ) && is_array( $data['advanced'] )
		? $data['advanced']
		: array( 'visible' => 1, 'background' => 'glow', 'padding' => 'normal', 'css_class' => '' );

	return $data;
}

/**
 * Default content. Mirrors src/data/siteData.js so the frontend
 * renders correctly the moment the plugin is active.
 *
 * @return array
 */
function vtech_core_default_content() {
	return array(
		'header' => array(
			'logo_image' => '',
			'logo_text'  => 'Tech Easy',
			'menu'       => array(
				array( 'label' => 'Home', 'url' => '#home', 'icon' => '', 'children' => array() ),
				array( 'label' => 'Services', 'url' => '#services', 'icon' => '', 'children' => array() ),
				array( 'label' => 'Portfolio', 'url' => '#portfolio', 'icon' => '', 'children' => array() ),
				array( 'label' => 'About', 'url' => '#about', 'icon' => '', 'children' => array() ),
				array( 'label' => 'Pricing', 'url' => '#pricing', 'icon' => '', 'children' => array() ),
				array( 'label' => 'Blog', 'url' => '#blog', 'icon' => '', 'children' => array() ),
				array( 'label' => 'Contact', 'url' => '#contact', 'icon' => '', 'children' => array() ),
			),
			'button'     => array(
				'label' => 'Get Started',
				'url'   => '#contact',
				'icon'  => '',
			),
		),
		'footer' => array(
			'logo_image' => '',
			'logo_text'  => 'Tech Easy',
			'tagline'   => 'Smart IT Solutions for a Better Tomorrow.',
			'columns'   => array(
				array(
					'title' => 'Quick Links',
					'links' => array(
						array( 'label' => 'Home', 'url' => '#home' ),
						array( 'label' => 'Services', 'url' => '#services' ),
						array( 'label' => 'About', 'url' => '#about' ),
						array( 'label' => 'Portfolio', 'url' => '#portfolio' ),
						array( 'label' => 'Pricing', 'url' => '#pricing' ),
						array( 'label' => 'Contact', 'url' => '#contact' ),
					),
				),
				array(
					'title' => 'Our Services',
					'links' => array(
						array( 'label' => 'Web Development', 'url' => '#services' ),
						array( 'label' => 'Mobile App Development', 'url' => '#services' ),
						array( 'label' => 'Cloud Solutions', 'url' => '#services' ),
						array( 'label' => 'Custom Software', 'url' => '#services' ),
						array( 'label' => 'UI/UX Design', 'url' => '#services' ),
						array( 'label' => 'IT Support', 'url' => '#services' ),
					),
				),
			),
			'contact'   => array(
				'title'   => 'Get In Touch',
				'address' => 'Bhopal, Madhya Pradesh, India',
				'phone'   => '+91 98765 43210',
				'email'   => 'info@techeasy.in',
				'hours'   => 'Mon - Sat: 9:00 AM - 7:00 PM',
			),
			'socials'   => array(
				array( 'icon' => 'facebook', 'url' => '#' ),
				array( 'icon' => 'instagram', 'url' => '#' ),
				array( 'icon' => 'linkedin', 'url' => '#' ),
				array( 'icon' => 'twitter', 'url' => '#' ),
				array( 'icon' => 'youtube', 'url' => '#' ),
			),
			'copyright' => '© 2025 Tech Easy. All rights reserved.',
			'legal'     => array(
				array( 'label' => 'Privacy Policy', 'url' => '#' ),
				array( 'label' => 'Terms & Conditions', 'url' => '#' ),
			),
		),
	);
}

/**
 * The Feather icon names offered in the admin icon picker.
 * These match react-icons/fi names on the frontend (Fi + PascalCase).
 *
 * @return array
 */
function vtech_feather_icons() {
	return array(
		'home', 'grid', 'briefcase', 'info', 'tag', 'file-text', 'mail', 'phone',
		'map-pin', 'clock', 'user', 'users', 'settings', 'code', 'smartphone',
		'cloud', 'shield', 'star', 'heart', 'award', 'zap', 'send', 'play',
		'arrow-right', 'chevron-right', 'external-link', 'layers', 'layout',
		'monitor', 'pen-tool', 'image', 'camera', 'shopping-cart', 'dollar-sign',
		'help-circle', 'message-circle', 'thumbs-up', 'globe', 'search',
		'facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'github',
	);
}

/**
 * Sanitize a link that may be a full URL or an in-page anchor (#id) or path.
 *
 * @param string $value raw link.
 * @return string
 */
function vtech_sanitize_link( $value ) {
	$value = trim( (string) $value );
	if ( '' === $value ) {
		return '';
	}
	// Preserve anchors and relative paths; esc_url_raw would strip bare "#id".
	if ( 0 === strpos( $value, '#' ) || 0 === strpos( $value, '/' ) ) {
		return sanitize_text_field( $value );
	}
	return esc_url_raw( $value );
}
