<?php
/**
 * VTech Pages registry.
 *
 * The frontend (React Router) owns a fixed set of routes. We mirror them here
 * so the admin can offer a "Show on page" control that is always in sync.
 * Adding a new page is a one-line change here (or via the `vtech_pages`
 * filter) and it automatically appears in every placement picker, dashboard
 * tab and REST listing — no other code needs editing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VTech_Pages {

	/**
	 * Cached, normalised page list.
	 *
	 * @var array|null
	 */
	private static $pages = null;

	/**
	 * Default frontend pages. Keyed by slug (matches the React route).
	 *
	 * @return array
	 */
	private static function defaults() {
		return array(
			'home'      => array( 'label' => 'Home',      'path' => '/',           'has_hero' => true ),
			'services'  => array( 'label' => 'Services',  'path' => '/services',   'has_hero' => true ),
			'portfolio' => array( 'label' => 'Portfolio', 'path' => '/portfolio',  'has_hero' => true ),
			'about'     => array( 'label' => 'About',     'path' => '/about',      'has_hero' => true ),
			'pricing'   => array( 'label' => 'Pricing',   'path' => '/pricing',    'has_hero' => true ),
			'blog'      => array( 'label' => 'Blog',      'path' => '/blog',       'has_hero' => true ),
			'contact'   => array( 'label' => 'Contact',   'path' => '/contact',    'has_hero' => true ),
		);
	}

	/**
	 * All registered pages (slug => [label, path, has_hero]).
	 *
	 * @return array
	 */
	public static function all() {
		if ( null !== self::$pages ) {
			return self::$pages;
		}

		/**
		 * Filter the registered frontend pages.
		 *
		 * @param array $pages slug => array( 'label', 'path', 'has_hero' ).
		 */
		$pages = apply_filters( 'vtech_pages', self::defaults() );

		$clean = array();
		foreach ( (array) $pages as $slug => $page ) {
			$slug = sanitize_key( $slug );
			if ( '' === $slug || ! is_array( $page ) ) {
				continue;
			}
			$clean[ $slug ] = array(
				'slug'     => $slug,
				'label'    => isset( $page['label'] ) ? (string) $page['label'] : ucfirst( $slug ),
				'path'     => isset( $page['path'] ) ? (string) $page['path'] : '/' . $slug,
				'has_hero' => ! empty( $page['has_hero'] ),
			);
		}

		self::$pages = $clean;
		return self::$pages;
	}

	/**
	 * Whether a slug is a known page.
	 *
	 * @param string $slug page slug.
	 * @return bool
	 */
	public static function exists( $slug ) {
		$pages = self::all();
		return isset( $pages[ $slug ] );
	}

	/**
	 * A single page definition or null.
	 *
	 * @param string $slug page slug.
	 * @return array|null
	 */
	public static function get( $slug ) {
		$pages = self::all();
		return isset( $pages[ $slug ] ) ? $pages[ $slug ] : null;
	}

	/**
	 * slug => label map, handy for building checklists/selects.
	 *
	 * @return array
	 */
	public static function choices() {
		$out = array();
		foreach ( self::all() as $slug => $page ) {
			$out[ $slug ] = $page['label'];
		}
		return $out;
	}
}
