<?php
/**
 * VTech Sections registry.
 *
 * Every editable block (per-page heroes + reusable sections like "Our
 * Services", "Our Process", "Our Work", Testimonials, CTA) registers itself
 * here with:
 *   - id       unique key stored in the option under 'sections'
 *   - label    admin-facing name
 *   - group    'hero' | 'reusable'
 *   - page     (hero only) the page slug this hero belongs to
 *   - fields   a schema array consumed by VTech_Admin::render_fields()
 *              and VTech_Admin::sanitize_by_schema()
 *   - defaults default values (mirrors the React siteData.js look)
 *
 * Because the admin form, the sanitizer and the REST output are all derived
 * from `fields`, adding or changing a field is a single edit here — no other
 * file needs to change.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VTech_Sections {

	/**
	 * Registered sections, id => definition.
	 *
	 * @var array
	 */
	private static $sections = array();

	/**
	 * Register (or replace) a section.
	 *
	 * @param array $args section definition.
	 */
	public static function register( array $args ) {
		if ( empty( $args['id'] ) ) {
			return;
		}
		$id = sanitize_key( $args['id'] );

		self::$sections[ $id ] = wp_parse_args(
			$args,
			array(
				'id'       => $id,
				'label'    => ucfirst( str_replace( array( '-', '_' ), ' ', $id ) ),
				'group'    => 'reusable',
				'page'     => '',       // for heroes: the owning page slug.
				'icon'     => 'dashicons-layout',
				'custom'   => false,    // true for admin-created sections.
				'fields'   => array(),  // schema.
				'defaults' => array(),
			)
		);
	}

	/**
	 * All sections (optionally only those still backed by a registration).
	 *
	 * @return array id => definition
	 */
	public static function all() {
		return self::$sections;
	}

	/**
	 * Sections in a group, in registration order.
	 *
	 * @param string $group 'hero' | 'reusable'.
	 * @return array id => definition
	 */
	public static function in_group( $group ) {
		$out = array();
		foreach ( self::$sections as $id => $def ) {
			if ( $def['group'] === $group ) {
				$out[ $id ] = $def;
			}
		}
		return $out;
	}

	/**
	 * The hero section definition owned by a page, or null.
	 *
	 * @param string $page_slug page slug.
	 * @return array|null
	 */
	public static function hero_for_page( $page_slug ) {
		foreach ( self::in_group( 'hero' ) as $def ) {
			if ( $def['page'] === $page_slug ) {
				return $def;
			}
		}
		return null;
	}

	/**
	 * A single section definition, or null.
	 *
	 * @param string $id section id.
	 * @return array|null
	 */
	public static function get( $id ) {
		return isset( self::$sections[ $id ] ) ? self::$sections[ $id ] : null;
	}

	/**
	 * Reusable sections owned by a page (its own fields shown in that page's
	 * admin menu). Ownership is the section's `page` key; pages with no owned
	 * section get an auto-registered generic one (see registry.php).
	 *
	 * @param string $page_slug page slug.
	 * @return array id => definition
	 */
	public static function for_page( $page_slug ) {
		$out = array();
		foreach ( self::$sections as $id => $def ) {
			if ( 'reusable' !== $def['group'] ) {
				continue;
			}
			if ( isset( $def['page'] ) && $def['page'] === $page_slug ) {
				$out[ $id ] = $def;
			}
		}
		return $out;
	}

	/**
	 * Default content for every section keyed by id. Used to seed the option
	 * and as a merge base so missing keys always resolve.
	 *
	 * @return array
	 */
	public static function defaults() {
		$out = array();
		foreach ( self::$sections as $id => $def ) {
			$out[ $id ] = $def['defaults'];
		}
		return $out;
	}
}
