<?php
/**
 * Section registry definitions.
 *
 * Registers a hero section per page and the reusable sections (Our Services,
 * Our Process, Our Work, Testimonials, CTA). Admin forms, sanitizers and REST
 * output are all generated from the `fields` schema declared here.
 *
 * Hooked late (priority 20) on `init` so VTech_Pages / VTech_Sections exist.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reusable field: a single CTA button (label + link + icon).
 *
 * @return array group schema.
 */
function vtech_button_schema( $label = 'Button' ) {
	return array(
		'type'   => 'group',
		'label'  => $label,
		'fields' => array(
			'label' => array( 'type' => 'text', 'label' => 'Text' ),
			'url'   => array( 'type' => 'url', 'label' => 'Link' ),
			'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
		),
	);
}

/**
 * The fields that make up a SINGLE hero slide. Reused inside the `slides`
 * repeater below (and kept standalone so legacy flat heroes can be migrated
 * into slides[0] without duplicating the field list).
 *
 * @return array
 */
function vtech_hero_slide_fields() {
	return array(
		'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow / Badge', 'placeholder' => 'About Us' ),
		'title'       => array( 'type' => 'text', 'label' => 'Title (line 1)', 'placeholder' => 'Turning Ideas into' ),
		'accent'      => array( 'type' => 'text', 'label' => 'Accent (gradient line)', 'placeholder' => 'Digital Reality' ),
		'title_end'   => array( 'type' => 'text', 'label' => 'Title (line 3, optional)' ),
		'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
		'image'       => array( 'type' => 'image', 'label' => 'Hero Image' ),
		'note'        => array( 'type' => 'text', 'label' => 'Slanted note (use | for new lines)', 'placeholder' => 'Better|Ideas|Bigger|Future' ),
		'points'      => array(
			'type'       => 'repeater',
			'label'      => 'Feature Points',
			'item_label' => 'Point',
			'fields'     => array(
				'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
				'title' => array( 'type' => 'text', 'label' => 'Title' ),
				'sub'   => array( 'type' => 'text', 'label' => 'Subtitle' ),
			),
		),
		'primary'     => vtech_button_schema( 'Primary Button' ),
		'secondary'   => vtech_button_schema( 'Secondary Button' ),
	);
}

/**
 * The common hero schema shared by every page's hero.
 *
 * A hero is now a SLIDER: it holds a repeatable list of `slides` (add as many
 * as you like, drag to reorder), plus slider-wide behaviour and the shared
 * `advanced` options group.
 *
 * @return array
 */
function vtech_hero_schema() {
	return array(
		'slides'      => array(
			'type'              => 'repeater',
			'label'             => 'Hero Slides',
			'item_label'        => 'Slide',
			'collapsible'       => true,
			'collapsible_panel' => false,
			'title_field'       => 'title',
			'fields'            => vtech_hero_slide_fields(),
		),
		'slider'      => array(
			'type'        => 'group',
			'label'       => 'Slider Options',
			'collapsible' => true,
			'fields'      => array(
				'autoplay'  => array( 'type' => 'toggle', 'label' => 'Auto-play slides', 'default' => 1 ),
				'interval'  => array( 'type' => 'number', 'label' => 'Auto-play interval (ms)', 'default' => 6000 ),
				'loop'      => array( 'type' => 'toggle', 'label' => 'Loop (wrap around)', 'default' => 1 ),
				'arrows'    => array( 'type' => 'toggle', 'label' => 'Show prev / next arrows', 'default' => 1 ),
				'dots'      => array( 'type' => 'toggle', 'label' => 'Show dots', 'default' => 1 ),
			),
		),
		'advanced'    => array(
			'type'   => 'group',
			'label'  => 'Advanced Options',
			'fields' => array(
				'visible'    => array( 'type' => 'toggle', 'label' => 'Show this hero', 'default' => 1 ),
				'background' => array(
					'type'    => 'select',
					'label'   => 'Background Style',
					'default' => 'glow',
					'options' => array(
						'glow'  => 'Glow accents (default)',
						'plain' => 'Plain',
						'image' => 'Background image',
					),
				),
				'padding'    => array(
					'type'    => 'select',
					'label'   => 'Spacing',
					'default' => 'normal',
					'options' => array(
						'compact' => 'Compact',
						'normal'  => 'Normal',
						'large'   => 'Large',
					),
				),
				'css_class'  => array( 'type' => 'text', 'label' => 'Extra CSS class' ),
			),
		),
	);
}

/**
 * Hero defaults for a given page (sensible per-page copy mirroring siteData).
 *
 * @param string $slug page slug.
 * @return array
 */
function vtech_hero_defaults( $slug ) {
	$slide_common = array(
		'eyebrow'     => '',
		'title'       => '',
		'accent'      => '',
		'title_end'   => '',
		'description' => '',
		'image'       => '',
		'note'        => '',
		'points'      => array(),
		'primary'     => array( 'label' => '', 'url' => '', 'icon' => '' ),
		'secondary'   => array( 'label' => '', 'url' => '', 'icon' => '' ),
	);

	$per_page = array(
		'home'      => array( 'eyebrow' => 'Innovative � Creative � Reliable', 'title' => 'We Build', 'accent' => 'Modern Websites & Powerful Apps', 'description' => 'Turn your ideas into digital solutions with our expert web and app development services.' ),
		'about'     => array( 'eyebrow' => 'About Us', 'title' => 'Turning Ideas into', 'accent' => 'Digital Reality', 'description' => 'Tech Easy is a passionate team of developers, designers and digital experts.' ),
		'portfolio' => array( 'eyebrow' => 'Our Portfolio', 'title' => 'Our Work Speaks', 'accent' => 'Better Than Words', 'description' => 'We build modern, scalable and high-performance digital solutions.' ),
		'contact'   => array( 'eyebrow' => 'Get In Touch', 'title' => "We'd Love to", 'accent' => 'Hear From You', 'description' => 'Have a project in mind, a question, or just want to say hello?' ),
		'blog'      => array( 'eyebrow' => 'Our Blog', 'title' => 'Latest Insights,', 'accent' => 'Tips & Trends', 'title_end' => 'in Tech & Digital World', 'description' => 'Stay updated with the latest trends, tutorials and expert insights.' ),
		'pricing'   => array( 'eyebrow' => 'Pricing', 'title' => 'Simple, Transparent', 'accent' => 'Pricing Plans', 'description' => 'Choose a plan that fits your business. No hidden fees, no surprises.' ),
		'services'  => array( 'eyebrow' => 'Our Services', 'title' => 'Digital Solutions', 'accent' => 'That Drive Growth', 'description' => 'End-to-end web, mobile and cloud services to help your business scale.' ),
	);

	$first_slide = array_merge( $slide_common, isset( $per_page[ $slug ] ) ? $per_page[ $slug ] : array() );

	return array(
		'slides'   => array( $first_slide ),
		'slider'   => array( 'autoplay' => 1, 'interval' => 6000, 'loop' => 1, 'arrows' => 1, 'dots' => 1 ),
		'advanced' => array( 'visible' => 1, 'background' => 'glow', 'padding' => 'normal', 'css_class' => '' ),
	);
}

/**
 * Choices for each project's multi-select category field.
 *
 * @return array category name => category label.
 */
function vtech_portfolio_category_options() {
	$defaults = array( 'Website', 'Mobile App', 'Web Application', 'UI/UX Design', 'E-Commerce', 'Branding' );
	$content  = get_option( VTECH_CORE_OPTION, array() );
	$rows     = isset( $content['sections']['projects']['categories'] ) && is_array( $content['sections']['projects']['categories'] )
		? $content['sections']['projects']['categories']
		: array();
	$options = array();

	foreach ( $rows as $row ) {
		$name = isset( $row['name'] ) ? sanitize_text_field( $row['name'] ) : '';
		if ( '' !== $name ) {
			$options[ $name ] = $name;
		}
	}

	if ( empty( $options ) ) {
		foreach ( $defaults as $name ) {
			$options[ $name ] = $name;
		}
	}

	return $options;
}

/**
 * Choices for service categories saved in the Services editor.
 *
 * @return array category name => category label.
 */
function vtech_service_category_options() {
	$defaults = array(
		'Web Development',
		'Mobile App Development',
		'Cloud Solutions',
		'Custom Software',
		'IT Support',
		'UI/UX Design',
	);
	$content  = get_option( VTECH_CORE_OPTION, array() );
	$rows     = isset( $content['sections']['services']['categories'] ) && is_array( $content['sections']['services']['categories'] )
		? $content['sections']['services']['categories']
		: array();
	$options = array();

	foreach ( $rows as $row ) {
		$name = isset( $row['name'] ) ? sanitize_text_field( $row['name'] ) : '';
		if ( '' !== $name ) {
			$options[ $name ] = $name;
		}
	}

	if ( empty( $options ) ) {
		foreach ( $defaults as $name ) {
			$options[ $name ] = $name;
		}
	}

	return $options;
}

/**
 * Choices for blog post categories, including saved categories in the Blog editor.
 *
 * @return array category name => category label.
 */
function vtech_blog_category_options() {
	$defaults = array(
		'Web Development', 'Mobile App', 'UI/UX Design', 'Digital Marketing',
		'Tips & Tricks', 'Technology', 'Business Growth', 'WordPress',
		'Programming', 'Cloud Computing', 'Productivity',
	);
	$content  = get_option( VTECH_CORE_OPTION, array() );
	$rows     = isset( $content['sections']['blog_content']['categories'] ) && is_array( $content['sections']['blog_content']['categories'] )
		? $content['sections']['blog_content']['categories']
		: array();
	$options = array();

	foreach ( $rows as $row ) {
		$name = isset( $row['name'] ) ? sanitize_text_field( $row['name'] ) : '';
		if ( '' !== $name ) {
			$options[ $name ] = $name;
		}
	}

	if ( empty( $options ) ) {
		foreach ( $defaults as $name ) {
			$options[ $name ] = $name;
		}
	}

	return $options;
}

/**
 * Register all heroes + reusable sections.
 */
function vtech_register_sections() {

	/* ---- Per-page heroes ---- */
	foreach ( VTech_Pages::all() as $slug => $page ) {
		if ( empty( $page['has_hero'] ) ) {
			continue;
		}
		VTech_Sections::register(
			array(
				'id'       => $slug . '_hero',
				'label'    => $page['label'] . ' Hero',
				'group'    => 'hero',
				'page'     => $slug,
				'icon'     => 'dashicons-cover-image',
				'fields'   => vtech_hero_schema(),
				'defaults' => vtech_hero_defaults( $slug ),
			)
		);
	}

	/* ---- Blog page content and articles ---- */
	VTech_Sections::register(
		array(
			'id'       => 'blog_content',
			'label'    => 'Blog Content & Articles',
			'group'    => 'reusable',
			'page'     => 'blog',
			'icon'     => 'dashicons-welcome-write-blog',
			'fields'   => array(
				'heading' => array(
					'type'        => 'group',
					'label'       => 'Articles Heading',
					'collapsible' => true,
					'fields' => array(
						'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
						'title'       => array( 'type' => 'text', 'label' => 'Title' ),
						'accent'      => array( 'type' => 'text', 'label' => 'Accent' ),
						'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					),
				),
				'categories' => array(
					'type'             => 'repeater',
					'label'            => 'Blog Categories',
					'item_label'       => 'Category',
					'collapsible_panel' => true,
					'fields'     => array(
						'name' => array( 'type' => 'text', 'label' => 'Category Name' ),
						'icon' => array( 'type' => 'icon', 'label' => 'Icon' ),
					),
				),
				'posts' => array(
					'type'       => 'repeater',
					'label'      => 'Blog Articles',
					'item_label' => 'Article',
					'collapsible' => true,
					'title_field' => 'title',
					'fields'     => array(
						'title'      => array( 'type' => 'text', 'label' => 'Article Title' ),
						'slug'       => array( 'type' => 'text', 'label' => 'URL Slug' ),
						'image'      => array( 'type' => 'image', 'label' => 'Featured Image' ),
						'categories' => array( 'type' => 'multi_select', 'label' => 'Categories', 'options' => vtech_blog_category_options() ),
						'excerpt'    => array( 'type' => 'textarea', 'label' => 'Short Description / Excerpt' ),
						'content'    => array( 'type' => 'editor', 'label' => 'Full Article Content' ),
						'date'       => array( 'type' => 'text', 'label' => 'Display Date' ),
						'author'     => array( 'type' => 'text', 'label' => 'Author' ),
						'views'      => array( 'type' => 'text', 'label' => 'Views Label' ),
						'read'       => array( 'type' => 'text', 'label' => 'Reading Time' ),
						'featured'   => array( 'type' => 'toggle', 'label' => 'Add to Feature (show on other pages)' ),
						'published'  => array( 'type' => 'toggle', 'label' => 'Show on Blog Page' ),
					),
				),
				'sidebar' => array(
					'type'        => 'group',
					'label'       => 'Blog Sidebar',
					'collapsible' => true,
					'fields' => array(
						'search_placeholder' => array( 'type' => 'text', 'label' => 'Search Placeholder' ),
						'categories_title'   => array( 'type' => 'text', 'label' => 'Categories Heading' ),
						'categories_link'    => array( 'type' => 'text', 'label' => 'Categories Link Label' ),
						'recent_title'       => array( 'type' => 'text', 'label' => 'Recent Posts Heading' ),
						'recent_link'        => array( 'type' => 'text', 'label' => 'Recent Posts Link Label' ),
					),
				),
				'placement' => array(
					'type'   => 'group',
					'label'  => 'Show on Pages & Order',
					'fields' => array(
						'blog' => array(
							'type'   => 'group',
							'label'  => 'Blog',
							'fields' => array(
								'show'  => array( 'type' => 'toggle', 'label' => 'Show on Blog' ),
								'order' => array( 'type' => 'number', 'label' => 'Order', 'default' => 1 ),
							),
						),
					),
				),
			),
			'defaults' => array(
				'heading' => array(
					'eyebrow'     => 'Our Blog',
					'title'       => 'Latest',
					'accent'      => 'Articles',
					'description' => 'Explore helpful articles, guides and tutorials to stay ahead in the tech world.',
				),
				'categories' => array(
					array( 'name' => 'Web Development', 'icon' => 'code' ),
					array( 'name' => 'Mobile App', 'icon' => 'smartphone' ),
					array( 'name' => 'UI/UX Design', 'icon' => 'image' ),
					array( 'name' => 'Digital Marketing', 'icon' => 'zap' ),
					array( 'name' => 'Tips & Tricks', 'icon' => 'zap' ),
					array( 'name' => 'Technology', 'icon' => 'cloud' ),
					array( 'name' => 'Business Growth', 'icon' => 'users' ),
					array( 'name' => 'WordPress', 'icon' => 'code' ),
					array( 'name' => 'Programming', 'icon' => 'code' ),
					array( 'name' => 'Cloud Computing', 'icon' => 'cloud' ),
					array( 'name' => 'Productivity', 'icon' => 'zap' ),
				),
				'posts' => array(
					array( 'title' => 'How to Build a Modern Website with React in 2025', 'slug' => 'modern-website-react', 'image' => 'https://placehold.co/640x360/0a0f29/22d3ee?text=React', 'categories' => array( 'Web Development' ), 'excerpt' => 'Learn step-by-step how to create a fast, responsive and modern website using React. From setup to deployment, this guide covers everything you need to get started.', 'date' => 'Sep 28, 2025', 'author' => 'Tech Easy Team', 'views' => '2.4K', 'read' => '6 min', 'published' => 1 ),
					array( 'title' => 'Top 10 Mobile App Development Trends in 2025', 'slug' => 'mobile-app-development-trends', 'image' => 'https://placehold.co/640x360/0a0f29/a855f7?text=Mobile+App', 'categories' => array( 'Mobile App' ), 'excerpt' => 'Discover the latest mobile app development trends that are shaping the future, from AI integration to cross-platform frameworks.', 'date' => 'Sep 25, 2025', 'author' => 'Tech Easy Team', 'views' => '1.8K', 'read' => '8 min', 'published' => 1 ),
					array( 'title' => 'UI/UX Design Principles for Better User Experience', 'slug' => 'ui-ux-design-principles', 'image' => 'https://placehold.co/640x360/0a0f29/ec4899?text=UI/UX', 'categories' => array( 'UI/UX Design' ), 'excerpt' => 'Learn the core principles of UI/UX design and how they can help you create user-friendly, engaging and conversion-focused digital products.', 'date' => 'Sep 22, 2025', 'author' => 'Tech Easy Team', 'views' => '1.5K', 'read' => '7 min', 'published' => 1 ),
					array( 'title' => 'How to Customize a WordPress Theme (Step by Step)', 'slug' => 'customize-wordpress-theme', 'image' => 'https://placehold.co/640x360/0a0f29/22d3ee?text=WordPress', 'categories' => array( 'WordPress' ), 'excerpt' => 'A complete guide to customizing your WordPress theme without touching core files. Make your website unique and professional.', 'date' => 'Sep 18, 2025', 'author' => 'Tech Easy Team', 'views' => '2.9K', 'read' => '10 min', 'published' => 1 ),
					array( 'title' => 'SEO Best Practices for 2025', 'slug' => 'seo-best-practices-2025', 'image' => 'https://placehold.co/640x360/0a0f29/10b981?text=SEO', 'categories' => array( 'Digital Marketing' ), 'excerpt' => 'Improve your website visibility with proven SEO strategies. Learn what is new and how to rank higher on Google.', 'date' => 'Sep 15, 2025', 'author' => 'Tech Easy Team', 'views' => '3.1K', 'read' => '9 min', 'published' => 1 ),
					array( 'title' => 'JavaScript ES6+ Features You Should Know', 'slug' => 'javascript-es6-features', 'image' => 'https://placehold.co/640x360/0a0f29/f59e0b?text=JavaScript', 'categories' => array( 'Programming' ), 'excerpt' => 'Master modern JavaScript with ES6+ features like arrow functions, destructuring, async/await and more.', 'date' => 'Sep 12, 2025', 'author' => 'Tech Easy Team', 'views' => '2.2K', 'read' => '8 min', 'published' => 1 ),
					array( 'title' => 'What is Cloud Hosting and Why It Matters?', 'slug' => 'cloud-hosting-guide', 'image' => 'https://placehold.co/640x360/0a0f29/0ea5e9?text=Cloud', 'categories' => array( 'Cloud Computing' ), 'excerpt' => 'Understand how cloud hosting works, its benefits and why it is a great choice for modern websites and applications.', 'date' => 'Sep 10, 2025', 'author' => 'Tech Easy Team', 'views' => '1.3K', 'read' => '6 min', 'published' => 1 ),
					array( 'title' => 'Best Tools for Developers in 2025', 'slug' => 'best-developer-tools', 'image' => 'https://placehold.co/640x360/0a0f29/a855f7?text=Dev+Tools', 'categories' => array( 'Productivity' ), 'excerpt' => 'Boost your productivity with top developer tools and resources. Save time, code better and build faster.', 'date' => 'Sep 8, 2025', 'author' => 'Tech Easy Team', 'views' => '2.7K', 'read' => '7 min', 'published' => 1 ),
				),
				'sidebar' => array(
					'search_placeholder' => 'Search blogs...',
					'categories_title'   => 'Categories',
					'categories_link'    => 'View All',
					'recent_title'       => 'Recent Posts',
					'recent_link'        => 'View All',
				),
				'placement' => array(
					'blog' => array( 'show' => 1, 'order' => 1 ),
				),
			),
		)
	);

	/* ---- Reusable: Featured Blogs, populated from featured Blog articles ---- */
	VTech_Sections::register(
		array(
			'id'       => 'featured_blogs',
			'label'    => 'Featured Blogs',
			'group'    => 'reusable',
			'page'     => '',
			'icon'     => 'dashicons-format-aside',
			'fields'   => array(
				'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
				'title'       => array( 'type' => 'text', 'label' => 'Title' ),
				'description' => array( 'type' => 'textarea', 'label' => 'Sub Description' ),
				'image'       => array( 'type' => 'image', 'label' => 'Section Image / Icon (optional)' ),
				'cta'         => array( 'type' => 'toggle', 'label' => 'Show "View All" Button' ),
				'cta_text'    => array( 'type' => 'text', 'label' => 'Button Text (View All)', 'placeholder' => 'View All Articles' ),
				'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)', 'placeholder' => '/blog' ),
				'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
			),
			'defaults' => array(
				'eyebrow'     => 'From Our Blog',
				'title'       => 'Featured Articles',
				'description' => 'Explore insights and ideas from our latest articles.',
				'image'       => '',
				'cta'         => 1,
				'cta_text'    => 'View All Articles',
				'cta_url'     => '/blog',
				'cta_icon'    => 'arrow-right',
				'placement'   => array(),
			),
		)
	);

	/* ---- About page: Mission, Vision & Values ---- */
	$pillar_colors = array(
		'from-brand-blue to-brand-cyan'     => 'Blue to Cyan',
		'from-brand-purple to-brand-pink'    => 'Purple to Pink',
		'from-emerald-400 to-teal-500'       => 'Emerald to Teal',
	);
	$pillar_fields = array(
		'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
		'color' => array( 'type' => 'select', 'label' => 'Icon Background', 'options' => $pillar_colors ),
		'title' => array( 'type' => 'text', 'label' => 'Title' ),
		'desc'  => array( 'type' => 'textarea', 'label' => 'Description' ),
	);
	VTech_Sections::register(
		array(
			'id'       => 'about_pillars',
			'label'    => 'Mission, Vision & Values',
			'group'    => 'reusable',
			'page'     => 'about',
			'icon'     => 'dashicons-awards',
			'fields'   => array(
				'eyebrow'      => array( 'type' => 'text', 'label' => 'Eyebrow (small label)' ),
				'title'        => array( 'type' => 'text', 'label' => 'Section Title' ),
				'title_accent' => array( 'type' => 'text', 'label' => 'Title Accent (highlighted part)' ),
				'description'  => array( 'type' => 'textarea', 'label' => 'Sub Description' ),
				'image'        => array( 'type' => 'image', 'label' => 'Section Image / Icon (optional)' ),
				'mission' => array(
					'type'   => 'group',
					'label'  => 'Our Mission',
					'fields' => $pillar_fields,
				),
				'vision'  => array(
					'type'   => 'group',
					'label'  => 'Our Vision',
					'fields' => $pillar_fields,
				),
				'values'  => array(
					'type'   => 'group',
					'label'  => 'Our Values',
					'fields' => array(
						'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
						'color' => array( 'type' => 'select', 'label' => 'Icon Background', 'options' => $pillar_colors ),
						'title' => array( 'type' => 'text', 'label' => 'Title' ),
						'items' => array(
							'type'       => 'repeater',
							'label'      => 'Values List',
							'item_label' => 'Value',
							'fields'     => array(
								'text' => array( 'type' => 'text', 'label' => 'Value' ),
							),
						),
					),
				),
				'placement' => array(
					'type'   => 'group',
					'label'  => 'Show on Pages & Order',
					'fields' => vtech_placement_schema()['placement']['fields'],
				),
			),
			'defaults' => array(
				'eyebrow'      => 'What Drives Us',
				'title'        => 'Mission, Vision',
				'title_accent' => '& Values',
				'description'  => 'The principles that guide everything we do and shape how we build digital solutions.',
				'image'        => '',
				'mission' => array(
					'icon'  => 'eye',
					'color' => 'from-brand-blue to-brand-cyan',
					'title' => 'Our Mission',
					'desc'  => 'To deliver innovative, high-quality and user-friendly digital solutions that empower businesses to achieve their goals and create a lasting impact in the digital world.',
				),
				'vision' => array(
					'icon'  => 'zap',
					'color' => 'from-brand-purple to-brand-pink',
					'title' => 'Our Vision',
					'desc'  => 'To become a global leader in digital transformation, known for driving real results through technology and customer success.',
				),
				'values' => array(
					'icon'  => 'handshake',
					'color' => 'from-emerald-400 to-teal-500',
					'title' => 'Our Values',
					'items' => array(
						array( 'text' => 'Innovation & Creativity' ),
						array( 'text' => 'Integrity & Transparency' ),
						array( 'text' => 'Customer First' ),
						array( 'text' => 'Continuous Learning' ),
						array( 'text' => 'Teamwork & Growth' ),
					),
				),
				'placement' => array(
					'about' => array( 'show' => 1, 'order' => 2 ),
				),
			),
		)
	);

	/* ---- About page: Our Story ---- */
	VTech_Sections::register(
		array(
			'id'       => 'about_story',
			'label'    => 'Our Story',
			'group'    => 'reusable',
			'page'     => 'about',
			'icon'     => 'dashicons-book-alt',
			'fields'   => array(
				'eyebrow'        => array( 'type' => 'text', 'label' => 'Eyebrow' ),
				'title'          => array( 'type' => 'text', 'label' => 'Title' ),
				'accent'         => array( 'type' => 'text', 'label' => 'Title Accent' ),
				'description'    => array( 'type' => 'textarea', 'label' => 'Description' ),
				'image'          => array( 'type' => 'image', 'label' => 'Story Image' ),
				'image_alt'      => array( 'type' => 'text', 'label' => 'Image Alt Text' ),
				'image_text'     => array( 'type' => 'text', 'label' => 'Image Overlay Text' ),
				'timeline'       => array(
					'type'       => 'repeater',
					'label'      => 'Timeline Years',
					'item_label' => 'Year',
					'fields'     => array(
						'year' => array( 'type' => 'text', 'label' => 'Year' ),
						'text' => array( 'type' => 'text', 'label' => 'Description' ),
					),
				),
				'cta_text'       => array( 'type' => 'text', 'label' => 'Button Text' ),
				'cta_url'        => array( 'type' => 'url', 'label' => 'Button Link' ),
				'placement' => array(
					'type'   => 'group',
					'label'  => 'Show on Pages & Order',
					'fields' => vtech_placement_schema()['placement']['fields'],
				),
			),
			'defaults' => array(
				'eyebrow'     => 'Our Story',
				'title'       => 'From a Small Idea',
				'accent'      => 'to a Growing Team',
				'description' => 'Tech Easy started with a simple vision � to make technology easy for everyone. What began as a small passion project has now grown into a full-fledged digital solutions company, serving clients across various industries.',
				'image'       => '',
				'image_alt'   => 'Our journey',
				'image_text'  => 'Dream Build Grow',
				'timeline'    => array(
					array( 'year' => '2023', 'text' => 'The idea was born' ),
					array( 'year' => '2024', 'text' => 'We started building and got our first clients' ),
					array( 'year' => '2025+', 'text' => 'Growing bigger, better and stronger' ),
				),
				'cta_text' => 'Learn More',
				'cta_url'  => '',
				'placement' => array(
					'about' => array( 'show' => 1, 'order' => 1 ),
				),
			),
		)
	);

	/* ---- About page: Team, Why Choose Us and banner ---- */
	VTech_Sections::register(
		array(
			'id'       => 'about_team',
			'label'    => 'Our Team',
			'group'    => 'reusable',
			'page'     => 'about',
			'icon'     => 'dashicons-groups',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'accent'      => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'cta_visible' => array( 'type' => 'toggle', 'label' => 'Show "View All" Button', 'default' => 1 ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text (View All)' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)' ),
					'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
					'parent_page' => array(
						'type'    => 'select',
						'label'   => 'Parent Page (shows ALL members)',
						'default' => 'about',
						'options' => VTech_Pages::choices(),
					),
					'members'     => array(
						'type'       => 'repeater',
						'label'      => 'Team Members',
						'item_label' => 'Member',
						'fields'     => array(
							'name'     => array( 'type' => 'text', 'label' => 'Name' ),
							'role'     => array( 'type' => 'text', 'label' => 'Role' ),
							'bio'      => array( 'type' => 'textarea', 'label' => 'Biography' ),
							'avatar'   => array( 'type' => 'image', 'label' => 'Photo' ),
							'socials'  => array(
								'type'       => 'repeater',
								'label'      => 'Social Links',
								'item_label' => 'Social Link',
								'fields'     => array(
									'icon' => array( 'type' => 'icon', 'label' => 'Icon' ),
									'url'  => array( 'type' => 'url', 'label' => 'Link' ),
								),
							),
							'feature'  => array( 'type' => 'toggle', 'label' => 'Add to Feature (show on other pages)' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Our Team',
				'title'       => 'The People Behind',
				'accent'      => 'Tech Easy',
				'description' => "We're a group of skilled professionals, united by a passion for technology and a commitment to excellence.",
				'cta_visible' => 1,
				'cta'         => 'Meet Our Team',
				'cta_url'     => '/about',
				'cta_icon'    => 'arrow-right',
				'parent_page' => 'about',
				'members'     => array(
					array( 'name' => 'Rohit Sharma', 'role' => 'Founder & CEO', 'bio' => 'Visionary leader with a passion for innovation.', 'avatar' => 'https://placehold.co/300x340/121a40/ffffff?text=RS' ),
					array( 'name' => 'Priya Patel', 'role' => 'CTO', 'bio' => 'Turning ideas into scalable technology solutions.', 'avatar' => 'https://placehold.co/300x340/121a40/ffffff?text=PP' ),
					array( 'name' => 'Amit Verma', 'role' => 'Lead Developer', 'bio' => 'Building fast, secure and future-ready applications.', 'avatar' => 'https://placehold.co/300x340/121a40/ffffff?text=AV' ),
					array( 'name' => 'Neha Singh', 'role' => 'UI/UX Designer', 'bio' => 'Creating beautiful and user-friendly experiences.', 'avatar' => 'https://placehold.co/300x340/121a40/ffffff?text=NS' ),
					array( 'name' => 'Vikas Yadav', 'role' => 'Project Manager', 'bio' => 'Keeping things on track, from plan to success.', 'avatar' => 'https://placehold.co/300x340/121a40/ffffff?text=VY' ),
				),
				'placement'   => array( 'about' => array( 'show' => 1, 'order' => 3 ) ),
			),
		)
	);

/* ---- Homepage: Team section with GIFs linking to member websites ---- */
	VTech_Sections::register(
		array(
			'id'       => 'team',
			'label'    => 'Our Team (GIFs)',
			'group'    => 'reusable',
			'page'     => 'home',
			'icon'     => 'dashicons-groups',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'accent'      => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'cta_visible' => array( 'type' => 'toggle', 'label' => 'Show "View All" Button', 'default' => 1 ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text (View All)' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)' ),
					'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
					'members'     => array(
						'type'       => 'repeater',
						'label'      => 'Team Members',
						'item_label' => 'Member',
						'fields'     => array(
							'name'     => array( 'type' => 'text', 'label' => 'Name' ),
							'role'     => array( 'type' => 'text', 'label' => 'Role' ),
							'bio'      => array( 'type' => 'textarea', 'label' => 'Biography' ),
							'gif'      => array( 'type' => 'image', 'label' => 'Animated GIF (clickable)' ),
							'website'  => array( 'type' => 'url', 'label' => 'Website URL (GIF redirects here)' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Our Team',
				'title'       => 'The People Behind',
				'accent'      => 'Tech Easy',
				'description' => "We're a group of skilled professionals, united by a passion for technology and a commitment to excellence.",
				'cta_visible' => 1,
				'cta'         => 'Meet Our Team',
				'cta_url'     => '/about',
				'cta_icon'    => 'arrow-right',
				'members'     => array(
					array( 'name' => 'Rohit Sharma', 'role' => 'Founder & CEO', 'bio' => 'Visionary leader with a passion for innovation.', 'gif' => '', 'website' => '' ),
					array( 'name' => 'Priya Patel', 'role' => 'CTO', 'bio' => 'Turning ideas into scalable technology solutions.', 'gif' => '', 'website' => '' ),
					array( 'name' => 'Amit Verma', 'role' => 'Lead Developer', 'bio' => 'Building fast, secure and future-ready applications.', 'gif' => '', 'website' => '' ),
					array( 'name' => 'Neha Singh', 'role' => 'UI/UX Designer', 'bio' => 'Creating beautiful and user-friendly experiences.', 'gif' => '', 'website' => '' ),
					array( 'name' => 'Vikas Yadav', 'role' => 'Project Manager', 'bio' => 'Keeping things on track, from plan to success.', 'gif' => '', 'website' => '' ),
				),
				'placement'   => array( 'home' => array( 'show' => 1, 'order' => 5 ) ),
			),
		)
	);

	VTech_Sections::register(
		array(
			'id'       => 'about_why',
			'label'    => 'Why Choose Us',
			'group'    => 'reusable',
			'page'     => 'about',
			'icon'     => 'dashicons-thumbs-up',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'accent'      => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'image'       => array( 'type' => 'image', 'label' => 'Image' ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link' ),
					'stats'       => array(
						'type'       => 'repeater',
						'label'      => 'Highlights',
						'item_label' => 'Highlight',
						'fields'     => array(
							'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
							'value' => array( 'type' => 'text', 'label' => 'Value' ),
							'label' => array( 'type' => 'text', 'label' => 'Label' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Why Choose Us',
				'title'       => 'Trusted by Businesses',
				'accent'      => 'Worldwide',
				'description' => 'We combine technology, creativity and strategy to deliver digital solutions that drive real results. Our focus is on quality, long-term relationships and your success.',
				'image'       => 'https://placehold.co/640x460/0a0f29/2d7cff?text=Why+Choose+Us',
				'cta'         => 'Explore Services',
				'cta_url'     => '/services',
				'stats'       => array(
					array( 'icon' => 'handshake', 'value' => '50+', 'label' => 'Happy Clients' ),
					array( 'icon' => 'rocket', 'value' => '100+', 'label' => 'Projects Completed' ),
					array( 'icon' => 'star', 'value' => '99%', 'label' => 'Client Satisfaction' ),
					array( 'icon' => 'clock', 'value' => '5+', 'label' => 'Years Experience' ),
					array( 'icon' => 'support', 'value' => '24/7', 'label' => 'Support' ),
					array( 'icon' => 'shield', 'value' => '100%', 'label' => 'Commitment' ),
				),
				'placement'   => array( 'about' => array( 'show' => 1, 'order' => 4 ) ),
			),
		)
	);

	VTech_Sections::register(
		array(
			'id'       => 'about_banner',
			'label'    => 'About Call to Action',
			'group'    => 'reusable',
			'page'     => 'about',
			'icon'     => 'dashicons-megaphone',
			'fields'   => array_merge(
				array(
					'eyebrow'        => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'          => array( 'type' => 'text', 'label' => 'Title' ),
					'accent'         => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description'    => array( 'type' => 'textarea', 'label' => 'Description' ),
					'primary_label'  => array( 'type' => 'text', 'label' => 'Primary Button Text' ),
					'primary_url'    => array( 'type' => 'url', 'label' => 'Primary Button Link' ),
					'secondary_label' => array( 'type' => 'text', 'label' => 'Secondary Button Text' ),
					'secondary_url'  => array( 'type' => 'url', 'label' => 'Secondary Button Link' ),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'         => "Let's Build Together",
				'title'           => 'Ready to Turn Your Ideas',
				'accent'          => 'into Something Amazing?',
				'description'     => "Get in touch with us today and let's create something great together.",
				'primary_label'   => 'Get Started',
				'primary_url'     => '/contact',
				'secondary_label' => 'Watch Our Story',
				'placement'       => array( 'about' => array( 'show' => 1, 'order' => 5 ) ),
			),
		)
	);

	/* ---- Pricing page ---- */
	VTech_Sections::register(
		array(
			'id'       => 'pricing_content',
			'label'    => 'Pricing Plans',
			'group'    => 'reusable',
			'page'     => 'pricing',
			'icon'     => 'dashicons-money-alt',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'accent'      => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'popular_label' => array( 'type' => 'text', 'label' => 'Popular Plan Badge' ),
					'plans'       => array(
						'type'       => 'repeater',
						'label'      => 'Plans',
						'item_label' => 'Plan',
						'fields'     => array(
							'name'     => array( 'type' => 'text', 'label' => 'Plan Name' ),
							'desc'     => array( 'type' => 'textarea', 'label' => 'Description' ),
							'price'    => array( 'type' => 'text', 'label' => 'Price' ),
							'period'   => array( 'type' => 'text', 'label' => 'Billing Period' ),
							'featured' => array( 'type' => 'toggle', 'label' => 'Mark as Popular' ),
							'features' => array(
								'type'       => 'repeater',
								'label'      => 'Included Features',
								'item_label' => 'Feature',
								'fields'     => array(
									'text' => array( 'type' => 'text', 'label' => 'Feature' ),
								),
							),
							'cta'     => array( 'type' => 'text', 'label' => 'Button Text' ),
							'cta_url' => array( 'type' => 'url', 'label' => 'Button Link' ),
							'cta_icon' => array( 'type' => 'icon', 'label' => 'Button Icon' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Pricing',
				'title'       => 'Simple, Transparent',
				'accent'      => 'Pricing Plans',
				'description' => 'Choose a plan that fits your business. No hidden fees, no surprises.',
				'popular_label' => 'Most Popular',
				'plans'       => array(
					array( 'name' => 'Starter', 'price' => '?14,999', 'period' => '/project', 'desc' => 'Perfect for small businesses and personal websites.', 'featured' => 0, 'features' => array( array( 'text' => 'Responsive Website (up to 5 pages)' ), array( 'text' => 'Basic SEO Setup' ), array( 'text' => 'Contact Form' ), array( 'text' => '1 Month Support' ), array( 'text' => 'Mobile Friendly' ) ), 'cta' => 'Get Started', 'cta_url' => '/contact', 'cta_icon' => 'arrow-right' ),
					array( 'name' => 'Business', 'price' => '?39,999', 'period' => '/project', 'desc' => 'Ideal for growing businesses needing more power.', 'featured' => 1, 'features' => array( array( 'text' => 'Website (up to 15 pages)' ), array( 'text' => 'Advanced SEO' ), array( 'text' => 'CMS Integration' ), array( 'text' => '3 Months Support' ), array( 'text' => 'Speed Optimization' ), array( 'text' => 'Analytics Setup' ) ), 'cta' => 'Get Started', 'cta_url' => '/contact', 'cta_icon' => 'arrow-right' ),
					array( 'name' => 'Enterprise', 'price' => 'Custom', 'period' => '', 'desc' => 'Tailored solutions for large-scale applications.', 'featured' => 0, 'features' => array( array( 'text' => 'Custom Web / Mobile App' ), array( 'text' => 'Dedicated Team' ), array( 'text' => 'Priority Support 24/7' ), array( 'text' => 'Scalable Cloud Setup' ), array( 'text' => 'Ongoing Maintenance' ), array( 'text' => 'Custom Integrations' ) ), 'cta' => 'Contact Us', 'cta_url' => '/contact', 'cta_icon' => 'arrow-right' ),
				),
				'placement'   => array( 'pricing' => array( 'show' => 1, 'order' => 1 ) ),
			),
		)
	);

	/* ---- Contact page ---- */
	VTech_Sections::register(
		array(
			'id'       => 'contact_content',
			'label'    => 'Contact Page Content',
			'group'    => 'reusable',
			'page'     => 'contact',
			'icon'     => 'dashicons-email',
			'fields'   => array_merge(
				array(
					'info' => array(
						'type'   => 'group',
						'label'  => 'Contact Information',
						'fields' => array(
							'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
							'title'       => array( 'type' => 'text', 'label' => 'Title' ),
							'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
							'channels'    => array(
								'type'       => 'repeater',
								'label'      => 'Contact Channels',
								'item_label' => 'Channel',
								'fields'     => array(
									'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
									'title' => array( 'type' => 'text', 'label' => 'Title' ),
									'value' => array( 'type' => 'text', 'label' => 'Contact Value' ),
									'sub'   => array( 'type' => 'text', 'label' => 'Additional Text' ),
								),
							),
						),
					),
					'form' => array(
						'type'   => 'group',
						'label'  => 'Contact Form',
						'fields' => array(
							'eyebrow'             => array( 'type' => 'text', 'label' => 'Eyebrow' ),
							'title'               => array( 'type' => 'text', 'label' => 'Title' ),
							'description'         => array( 'type' => 'textarea', 'label' => 'Description' ),
							'fields'              => array(
								'type'          => 'repeater',
								'label'         => 'Form Fields',
								'item_label'    => 'Field',
								'collapsible'   => true,
								'title_field'   => 'label',
								'fields'        => array(
									'key'         => array( 'type' => 'text', 'label' => 'Field Key (letters/numbers, unique)' ),
									'label'       => array( 'type' => 'text', 'label' => 'Field Label' ),
									'type'        => array(
										'type'    => 'select',
										'label'   => 'Field Type',
										'options' => array(
											'text'          => 'Text',
											'textarea'      => 'Long Text',
											'email'         => 'Email',
											'tel'           => 'Phone',
											'number'        => 'Number',
											'url'           => 'Website URL',
											'select'        => 'Dropdown',
											'radio'         => 'Radio Options',
											'checkbox'      => 'Checkbox',
											'checkboxes'    => 'Multiple Checkboxes',
											'date'          => 'Date',
											'time'          => 'Time',
											'datetime-local' => 'Date & Time',
											'image'         => 'Image Upload',
											'pdf'           => 'PDF Upload',
											'file'          => 'File Upload',
										),
									),
									'placeholder' => array( 'type' => 'text', 'label' => 'Placeholder' ),
									'required'    => array( 'type' => 'toggle', 'label' => 'Required' ),
									'options'     => array( 'type' => 'textarea', 'label' => 'Options (one per line; dropdown/radio/checkboxes)' ),
									'file_types'  => array(
										'type'    => 'select',
										'label'   => 'Allowed File Types (File Upload)',
										'options' => array(
											'documents' => 'Documents (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)',
											'images'    => 'Images (JPG, PNG, GIF, WEBP)',
											'all'       => 'Documents and Images',
										),
									),
									'multiple'    => array( 'type' => 'toggle', 'label' => 'Allow Multiple Files' ),
								),
							),
							'terms_text'          => array( 'type' => 'text', 'label' => 'Terms Consent Text' ),
							'terms_url'           => array( 'type' => 'url', 'label' => 'Terms Link' ),
							'privacy_text'        => array( 'type' => 'text', 'label' => 'Privacy Consent Text' ),
							'privacy_url'         => array( 'type' => 'url', 'label' => 'Privacy Link' ),
							'submit_label'        => array( 'type' => 'text', 'label' => 'Submit Button Text' ),
							'privacy_notice'      => array( 'type' => 'text', 'label' => 'Privacy Notice' ),
						),
					),
					'office' => array(
						'type'   => 'group',
						'label'  => 'Office',
						'fields' => array(
							'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
							'title'       => array( 'type' => 'text', 'label' => 'Title' ),
							'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
							'image'       => array( 'type' => 'image', 'label' => 'Office Image' ),
							'address'     => array( 'type' => 'text', 'label' => 'Address Label' ),
							'map_image'   => array( 'type' => 'image', 'label' => 'Map Image' ),
							'features'    => array(
								'type'       => 'repeater',
								'label'      => 'Office Features',
								'item_label' => 'Feature',
								'fields'     => array(
									'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
									'title' => array( 'type' => 'text', 'label' => 'Title' ),
									'sub'   => array( 'type' => 'text', 'label' => 'Description' ),
								),
							),
							'cta'     => array( 'type' => 'text', 'label' => 'Office Tour Button Text' ),
							'cta_url' => array( 'type' => 'url', 'label' => 'Office Tour Link' ),
						),
					),
					'faq' => array(
						'type'   => 'group',
						'label'  => 'Frequently Asked Questions',
						'fields' => array(
							'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
							'title'       => array( 'type' => 'text', 'label' => 'Title' ),
							'accent'      => array( 'type' => 'text', 'label' => 'Title Accent' ),
							'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
							'cta'         => array( 'type' => 'text', 'label' => 'Button Text' ),
							'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link' ),
							'items'       => array(
								'type'       => 'repeater',
								'label'      => 'Questions',
								'item_label' => 'Question',
								'fields'     => array(
									'q' => array( 'type' => 'text', 'label' => 'Question' ),
									'a' => array( 'type' => 'textarea', 'label' => 'Answer' ),
								),
							),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'info' => array( 'eyebrow' => 'Contact Information', 'title' => "Let's Connect", 'description' => 'Feel free to reach out through any of the channels below. We�re available and happy to help!', 'channels' => array( array( 'icon' => 'phone', 'title' => 'Phone', 'value' => '+91 98765 43210', 'sub' => 'Mon - Sat: 9:00 AM - 7:00 PM' ), array( 'icon' => 'mail', 'title' => 'Email', 'value' => 'info@techeasy.in', 'sub' => 'We�ll get back within 24 hours.' ), array( 'icon' => 'message-circle', 'title' => 'WhatsApp', 'value' => '+91 98765 43210', 'sub' => 'Chat with us directly.' ), array( 'icon' => 'map-pin', 'title' => 'Our Office', 'value' => 'Bhopal, Madhya Pradesh, India', 'sub' => 'Near Chetak Bridge, Bhopal' ) ) ),
				'form' => array( 'eyebrow' => 'Send Us a Message', 'title' => 'Get In Touch', 'description' => 'Fill out the form below and we�ll get back to you shortly.', 'fields' => array( array( 'key' => 'name', 'label' => 'Your Name', 'type' => 'text', 'placeholder' => 'Enter your name', 'required' => 1 ), array( 'key' => 'email', 'label' => 'Email Address', 'type' => 'email', 'placeholder' => 'Enter your email', 'required' => 1 ), array( 'key' => 'phone', 'label' => 'Phone Number', 'type' => 'tel', 'placeholder' => 'Enter your phone number', 'required' => 1 ), array( 'key' => 'service', 'label' => 'Service Interested In', 'type' => 'select', 'placeholder' => 'Select a service', 'options' => "Web Development\nMobile App Development\nUI/UX Design\nCloud Solutions\nCustom Software\nOther" ), array( 'key' => 'details', 'label' => 'Project Details', 'type' => 'textarea', 'placeholder' => 'Tell us about your project or how we can help...' ) ), 'services' => array( array( 'name' => 'Web Development' ), array( 'name' => 'Mobile App Development' ), array( 'name' => 'UI/UX Design' ), array( 'name' => 'Cloud Solutions' ), array( 'name' => 'Custom Software' ), array( 'name' => 'Other' ) ), 'terms_text' => 'Terms & Conditions', 'privacy_text' => 'Privacy Policy', 'submit_label' => 'Send Message', 'privacy_notice' => 'Your information is safe with us. We respect your privacy.' ),
				'office' => array( 'eyebrow' => 'Our Office', 'title' => 'Visit Our Office', 'description' => 'We�re located in the heart of Bhopal. Feel free to visit us during our working hours.', 'image' => 'https://placehold.co/640x460/0a0f29/ec4899?text=Our+Office', 'address' => 'Tech Easy, Bhopal', 'map_image' => 'https://placehold.co/640x520/0a0f29/1b2550?text=Map', 'features' => array( array( 'icon' => 'map-pin', 'title' => 'Nearby Metro', 'sub' => '(2 km)' ), array( 'icon' => 'shield', 'title' => 'Parking Available', 'sub' => '(Free)' ), array( 'icon' => 'arrow-right', 'title' => 'Easy Access', 'sub' => 'From Main Road' ) ), 'cta' => 'View Office Tour' ),
				'faq' => array( 'eyebrow' => 'Quick Help', 'title' => 'Frequently Asked', 'accent' => 'Questions', 'description' => 'Find answers to some of the most common questions. Still have a question? Feel free to contact us.', 'cta' => 'View All FAQs', 'items' => array( array( 'q' => 'How long does it take to complete a project?', 'a' => 'Project timelines vary based on scope. A typical website takes 2�4 weeks, while larger web or mobile apps can take 6�12 weeks. We share a clear timeline before starting.' ), array( 'q' => 'Do you provide ongoing support after delivery?', 'a' => 'Yes. We offer maintenance and support packages to keep your product secure, updated and running smoothly after launch.' ), array( 'q' => 'What technologies do you use?', 'a' => 'We work with modern stacks like React, Node.js, React Native, WordPress and cloud platforms, choosing the best fit for your needs.' ), array( 'q' => 'How can I get a quote for my project?', 'a' => 'Just fill out the contact form or reach out via phone/email. We�ll discuss your requirements and send a detailed quote within 24 hours.' ) ) ),
				'placement' => array( 'contact' => array( 'show' => 1, 'order' => 1 ) ),
			),
		)
	);

	/* ---- Reusable: Our Services ---- */
	VTech_Sections::register(
		array(
			'id'       => 'services',
			'label'    => 'Our Services',
			'group'    => 'reusable',
			'page'     => 'services',
			'icon'     => 'dashicons-screenoptions',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'        => array( 'type' => 'text', 'label' => 'Title' ),
					'title_accent' => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description'  => array( 'type' => 'textarea', 'label' => 'Description' ),
					'cta_visible' => array( 'type' => 'toggle', 'label' => 'Show "View All" Button', 'default' => 1 ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text (View All)', 'placeholder' => 'View All Services' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)', 'placeholder' => '/services' ),
					'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
					'parent_page' => array(
						'type'    => 'select',
						'label'   => 'Parent Page (shows ALL cards)',
						'default' => 'services',
						'options' => VTech_Pages::choices(),
					),
					'categories' => array(
						'type'       => 'repeater',
						'label'      => 'Service Categories',
						'item_label' => 'Category',
						'fields'     => array(
							'name' => array( 'type' => 'text', 'label' => 'Category Name' ),
						),
					),
					'items'       => array(
						'type'       => 'repeater',
						'label'      => 'Service Cards',
						'item_label' => 'Service',
						'collapsible' => true,
						'title_field' => 'title',
						'fields'     => array(
							'slug'    => array( 'type' => 'text', 'label' => 'Detail Page URL Slug', 'placeholder' => 'web-development' ),
							'icon'    => array( 'type' => 'icon', 'label' => 'Icon' ),
							'title'   => array( 'type' => 'text', 'label' => 'Title' ),
							'image'   => array( 'type' => 'image', 'label' => 'Detail Page Featured Image' ),
							'categories' => array( 'type' => 'multi_select', 'label' => 'Service Categories', 'options' => vtech_service_category_options() ),
							'desc'    => array( 'type' => 'textarea', 'label' => 'Description' ),
							'detail_content' => array( 'type' => 'editor', 'label' => 'Service Detail Page Content' ),
							'flow' => array(
								'type'       => 'repeater',
								'label'      => 'Service Flow',
								'item_label' => 'Step',
								'fields'     => array(
									'title' => array( 'type' => 'text', 'label' => 'Step Title' ),
									'desc'  => array( 'type' => 'textarea', 'label' => 'Step Description' ),
								),
							),
							'button_text' => array( 'type' => 'text', 'label' => 'Get Started Button Text', 'placeholder' => 'Get Started' ),
							'button_url'  => array( 'type' => 'url', 'label' => 'Get Started Custom Link', 'placeholder' => '/contact#contact-form' ),
							'popular'     => array( 'type' => 'toggle', 'label' => 'Show in Popular Services' ),
							'feature' => array( 'type' => 'toggle', 'label' => 'Add to Feature (show on other pages)' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'      => 'Our Services',
				'title'        => 'What We Do',
				'title_accent' => 'Best',
				'description'  => 'We offer end-to-end digital solutions to help your business grow, from concept to deployment and beyond.',
				'cta_visible'  => 1,
				'cta'          => 'View All Services',
				'cta_url'      => '/services',
				'cta_icon'     => 'arrow-right',
				'parent_page'  => 'services',
				'categories'   => array_map(
					function ( $name ) {
						return array( 'name' => $name );
					},
					array( 'Web Development', 'Mobile App Development', 'Cloud Solutions', 'Custom Software', 'IT Support', 'UI/UX Design' )
				),
				'items'        => array(
					array( 'icon' => 'code', 'title' => 'Web Development', 'categories' => array( 'Web Development' ), 'desc' => 'Modern, responsive & SEO friendly websites for your business.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
					array( 'icon' => 'mobile', 'title' => 'Mobile App Development', 'categories' => array( 'Mobile App Development' ), 'desc' => 'iOS & Android apps with powerful features and great UX.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
					array( 'icon' => 'cloud', 'title' => 'Cloud Solutions', 'categories' => array( 'Cloud Solutions' ), 'desc' => 'Secure, scalable & flexible cloud infrastructure.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
					array( 'icon' => 'gear', 'title' => 'Custom Software', 'categories' => array( 'Custom Software' ), 'desc' => 'Tailored software to meet your business needs.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
					array( 'icon' => 'shield', 'title' => 'IT Support & Maintenance', 'categories' => array( 'IT Support' ), 'desc' => 'Keep your systems running smoothly.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
					array( 'icon' => 'palette', 'title' => 'UI/UX Design', 'categories' => array( 'UI/UX Design' ), 'desc' => 'Beautiful and user-friendly interfaces for better engagement.', 'button_text' => 'Get Started', 'button_url' => '/contact#contact-form', 'feature' => 0 ),
				),
				'placement'    => array(
					'home'     => array( 'show' => 1, 'order' => 1 ),
					'services' => array( 'show' => 1, 'order' => 1 ),
				),
			),
		)
	);

	/* ---- Reusable: Our Process ---- */
	VTech_Sections::register(
		array(
			'id'       => 'process',
			'label'    => 'Our Process',
			'group'    => 'reusable',
			'page'     => 'home',
			'icon'     => 'dashicons-controls-repeat',
			'fields'   => array_merge(
				array(
					'eyebrow'      => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'        => array( 'type' => 'text', 'label' => 'Title' ),
					'title_accent' => array( 'type' => 'text', 'label' => 'Title Accent' ),
					'description'  => array( 'type' => 'textarea', 'label' => 'Description' ),
					'cta'          => array( 'type' => 'text', 'label' => 'Button Text' ),
					'cta_url'      => array( 'type' => 'url', 'label' => 'Button Link' ),
					'cta_icon'     => array( 'type' => 'icon', 'label' => 'Button Icon' ),
					'cta_visible'  => array( 'type' => 'toggle', 'label' => 'Show Button', 'default' => 1 ),
					'steps'        => array(
						'type'       => 'repeater',
						'label'      => 'Steps',
						'item_label' => 'Step',
						'fields'     => array(
							'no'    => array( 'type' => 'text', 'label' => 'Number' ),
							'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
							'color' => array(
								'type'    => 'select',
								'label'   => 'Icon Background',
								'default' => 'from-brand-blue to-brand-cyan',
								'options' => array(
									'from-brand-blue to-brand-cyan'  => 'Blue to Cyan',
									'from-emerald-400 to-teal-500'   => 'Emerald to Teal',
									'from-brand-purple to-brand-pink' => 'Purple to Pink',
									'from-orange-400 to-amber-500'   => 'Orange to Amber',
								),
							),
							'title' => array( 'type' => 'text', 'label' => 'Title' ),
							'desc'  => array( 'type' => 'textarea', 'label' => 'Description' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'      => 'Our Process',
				'title'        => 'Simple Steps to',
				'title_accent' => 'Get Your Project Done',
				'description'  => 'We follow a clear and transparent process for on-time delivery.',
				'cta'          => 'View Process',
				'cta_url'      => '#contact',
				'cta_icon'     => 'arrow-right',
				'cta_visible'  => 1,
				'steps'        => array(
					array( 'no' => '01', 'icon' => 'chat', 'color' => 'from-brand-blue to-brand-cyan', 'title' => 'Discuss', 'desc' => 'Understand your requirements' ),
					array( 'no' => '02', 'icon' => 'clipboard', 'color' => 'from-emerald-400 to-teal-500', 'title' => 'Plan', 'desc' => 'We create a custom strategy' ),
					array( 'no' => '03', 'icon' => 'code', 'color' => 'from-brand-purple to-brand-pink', 'title' => 'Develop', 'desc' => 'We build & test your solution' ),
					array( 'no' => '04', 'icon' => 'rocket', 'color' => 'from-orange-400 to-amber-500', 'title' => 'Launch', 'desc' => 'We get your product on time' ),
				),
				'placement'    => array(
					'home'     => array( 'show' => 1, 'order' => 3 ),
					'services' => array( 'show' => 1, 'order' => 2 ),
				),
			),
		)
	);

	/* ---- Reusable: Our Work (Projects) ---- */
	VTech_Sections::register(
		array(
			'id'       => 'projects',
			'label'    => 'Our Work',
			'group'    => 'reusable',
			'page'     => 'portfolio',
			'icon'     => 'dashicons-portfolio',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'cta_visible' => array( 'type' => 'toggle', 'label' => 'Show "View All" Button', 'default' => 1 ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text (View All)' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)', 'placeholder' => '/portfolio' ),
					'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
					'categories'  => array(
						'type'       => 'repeater',
						'label'      => 'Portfolio Categories',
						'item_label' => 'Category',
						'fields'     => array(
							'name' => array( 'type' => 'text', 'label' => 'Category Name' ),
						),
					),
					'parent_page' => array(
						'type'    => 'select',
						'label'   => 'Parent Page (shows ALL work)',
						'default' => 'portfolio',
						'options' => VTech_Pages::choices(),
					),
					'items'       => array(
						'type'       => 'repeater',
						'label'      => 'Work / Projects',
						'item_label' => 'Project',
						'collapsible' => true,
						'title_field' => 'title',
						'fields'     => array(
							'slug'        => array( 'type' => 'text', 'label' => 'Detail Page URL Slug', 'placeholder' => 'bizconnect-corporate-website' ),
							'image'       => array( 'type' => 'image', 'label' => 'Project Image' ),
							'brand'       => array( 'type' => 'text', 'label' => 'Brand Name (overlay on image)', 'placeholder' => 'BizConnect' ),
							'categories'  => array( 'type' => 'multi_select', 'label' => 'Categories (select multiple)', 'options' => vtech_portfolio_category_options() ),
							'title'       => array( 'type' => 'text', 'label' => 'Title', 'placeholder' => 'BizConnect � Corporate Website' ),
							'author'      => array( 'type' => 'text', 'label' => 'Author / Project Team' ),
							'date'        => array( 'type' => 'text', 'label' => 'Project Date' ),
							'desc'        => array( 'type' => 'textarea', 'label' => 'Short Description' ),
							'tech'        => array(
								'type'       => 'repeater',
								'label'      => 'Tech Stack',
								'item_label' => 'Tech',
								'fields'     => array(
									'name' => array( 'type' => 'text', 'label' => 'Tech Name', 'placeholder' => 'React' ),
								),
							),
							'detail_content' => array( 'type' => 'editor', 'label' => 'Project Detail Page Content' ),
							'button_url'  => array( 'type' => 'url', 'label' => 'Project Link (View Project button)', 'placeholder' => 'https://example.com' ),
							'gallery'     => array(
								'type'       => 'repeater',
								'label'      => 'Project Gallery Images (shown below project details)',
								'item_label' => 'Gallery Image',
								'fields'     => array(
									'image' => array( 'type' => 'image', 'label' => 'Gallery Image' ),
								),
							),
							'feature'     => array( 'type' => 'toggle', 'label' => 'Add to Feature (show on other pages)' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Our Work',
				'title'       => 'Featured Projects',
				'description' => 'Explore some of our recent work.',
				'cta_visible' => 1,
				'cta'         => 'View All Projects',
				'cta_url'     => '/portfolio',
				'cta_icon'    => 'arrow-right',
				'parent_page' => 'portfolio',
				'categories'  => array(
					array( 'name' => 'Website' ),
					array( 'name' => 'Mobile App' ),
					array( 'name' => 'Web Application' ),
					array( 'name' => 'UI/UX Design' ),
					array( 'name' => 'E-Commerce' ),
					array( 'name' => 'Branding' ),
				),
				'items'       => array(
					array( 'image' => 'https://placehold.co/640x420/0a0f29/2d7cff?text=BizConnect', 'brand' => 'BizConnect', 'categories' => array( 'Website' ), 'title' => 'BizConnect � Corporate Website', 'desc' => 'Modern corporate website for a digital consulting company with a clean UI and fast performance.', 'tech' => array( array( 'name' => 'React' ), array( 'name' => 'WordPress' ), array( 'name' => 'Tailwind' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/a855f7?text=FitLife', 'brand' => 'FitLife', 'categories' => array( 'Mobile App' ), 'title' => 'FitLife � Fitness App', 'desc' => 'A complete fitness tracking app with workout plans, progress tracking and healthy lifestyle tips.', 'tech' => array( array( 'name' => 'React Native' ), array( 'name' => 'Firebase' ), array( 'name' => 'UI/UX' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/22d3ee?text=EduVerse', 'brand' => 'EduVerse', 'categories' => array( 'Web Application' ), 'title' => 'EduVerse � Learning Platform', 'desc' => 'Online learning platform with video courses, quizzes and student progress tracking.', 'tech' => array( array( 'name' => 'React' ), array( 'name' => 'Node.js' ), array( 'name' => 'MongoDB' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 1 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/f97316?text=StyleCart', 'brand' => 'StyleCart', 'categories' => array( 'E-Commerce' ), 'title' => 'StyleCart � E-Commerce Store', 'desc' => 'Modern online store with secure payment, product filters and smooth shopping experience.', 'tech' => array( array( 'name' => 'React' ), array( 'name' => 'Stripe' ), array( 'name' => 'Tailwind' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/ec4899?text=Travely', 'brand' => 'Travely', 'categories' => array( 'UI/UX Design' ), 'title' => 'Travely � Travel Booking UI', 'desc' => 'Clean and modern UI/UX design for travel booking with smooth user experience.', 'tech' => array( array( 'name' => 'Figma' ), array( 'name' => 'UI/UX' ), array( 'name' => 'Prototype' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/22d3ee?text=FoodHub', 'brand' => 'FoodHub', 'categories' => array( 'Website' ), 'title' => 'FoodHub � Restaurant Website', 'desc' => 'A beautiful and responsive restaurant website with online menu and table booking.', 'tech' => array( array( 'name' => 'WordPress' ), array( 'name' => 'Elementor' ), array( 'name' => 'JavaScript' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/a855f7?text=TaskPro', 'brand' => 'TaskPro', 'categories' => array( 'Mobile App' ), 'title' => 'TaskPro � Productivity App', 'desc' => 'Task management app with team collaboration, reminders and real-time sync.', 'tech' => array( array( 'name' => 'React Native' ), array( 'name' => 'Firebase' ), array( 'name' => 'Redux' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/22d3ee?text=HealthCare', 'brand' => 'HealthCare', 'categories' => array( 'Web Application' ), 'title' => 'HealthCare � Hospital Management', 'desc' => 'Patient management system with appointment booking and doctor panel.', 'tech' => array( array( 'name' => 'React' ), array( 'name' => 'Node.js' ), array( 'name' => 'MySQL' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
					array( 'image' => 'https://placehold.co/640x420/0a0f29/ec4899?text=PixelCraft', 'brand' => 'PixelCraft', 'categories' => array( 'Branding' ), 'title' => 'PixelCraft � Brand Identity', 'desc' => 'Logo, brand guide and complete visual identity design for a creative agency.', 'tech' => array( array( 'name' => 'Logo Design' ), array( 'name' => 'Branding' ), array( 'name' => 'Graphics' ) ), 'button' => 1, 'button_text' => 'View Project', 'button_url' => '', 'button_icon' => 'arrowRight', 'external' => 0, 'feature' => 0 ),
				),
				'placement'   => array(
					'home'      => array( 'show' => 1, 'order' => 4 ),
					'portfolio' => array( 'show' => 1, 'order' => 1 ),
				),
			),
		)
	);

	/* ---- Reusable: Case Study ---- */
	VTech_Sections::register(
		array(
			'id'       => 'case_study',
			'label'    => 'Case Study',
			'group'    => 'reusable',
			'page'     => '',
			'icon'     => 'dashicons-media-document',
			'fields'   => array(
					'image'       => array( 'type' => 'image', 'label' => 'Case Study Image' ),
					'brand'       => array( 'type' => 'text', 'label' => 'Brand Text on Image', 'placeholder' => 'EduVerse Dashboard' ),
					'badge'       => array( 'type' => 'text', 'label' => 'Badge Label (optional)', 'placeholder' => 'Featured Case Study' ),
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title', 'placeholder' => 'EduVerse � Learning Platform' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'tech'        => array(
						'type'       => 'repeater',
						'label'      => 'Tech Stack',
						'item_label' => 'Tech',
						'fields'     => array(
							'name' => array( 'type' => 'text', 'label' => 'Tech Name', 'placeholder' => 'React' ),
						),
					),
					'stats'       => array(
						'type'       => 'repeater',
						'label'      => 'Stats / Highlights',
						'item_label' => 'Stat',
						'fields'     => array(
							'value' => array( 'type' => 'text', 'label' => 'Value', 'placeholder' => '120+' ),
							'label' => array( 'type' => 'text', 'label' => 'Label', 'placeholder' => 'Active Students' ),
						),
					),
					'button'      => array( 'type' => 'toggle', 'label' => 'Show Button' ),
					'button_text' => array( 'type' => 'text', 'label' => 'Button Name', 'placeholder' => 'View Full Project' ),
					'button_url'  => array( 'type' => 'url', 'label' => 'Button Link', 'placeholder' => 'https://example.com' ),
					'button_icon' => array( 'type' => 'icon', 'label' => 'Button Icon' ),
			),
			'defaults' => array(
				'image'       => 'https://placehold.co/960x660/0a0f29/2d7cff?text=Case+Study',
				'eyebrow'     => 'Case Study',
				'title'       => 'EduVerse � Learning Platform',
				'description' => 'We developed a modern and scalable learning platform with video courses, live sessions, quizzes and student progress tracking. The platform is designed to provide a seamless and engaging learning experience across all devices.',
				'brand'       => 'EduVerse Dashboard',
				'badge'       => 'Featured Case Study',
				'tech'        => array( array( 'name' => 'React' ), array( 'name' => 'Node.js' ), array( 'name' => 'MongoDB' ), array( 'name' => 'Tailwind' ) ),
				'stats'       => array( array( 'value' => '120+', 'label' => 'Active Students' ), array( 'value' => '50+', 'label' => 'Courses' ), array( 'value' => '99.9%', 'label' => 'Uptime' ) ),
				'button'      => 1,
				'button_text' => 'View Full Project',
				'button_url'  => '',
				'button_icon' => 'arrowRight',
				'feature'     => 1,
				'parent_page' => 'portfolio',
				'placement'   => array(
					'portfolio' => array( 'show' => 1, 'order' => 2 ),
				),
			),
		)
	);

	/* ---- Reusable: Testimonials ---- */
	VTech_Sections::register(
		array(
			'id'       => 'testimonials',
			'label'    => 'Testimonials',
			'group'    => 'reusable',
			'page'     => 'home',
			'icon'     => 'dashicons-format-quote',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Sub Description' ),
					'image'       => array( 'type' => 'image', 'label' => 'Section Image / Icon (optional)' ),
					'cta_visible' => array( 'type' => 'toggle', 'label' => 'Show "View All" Button' ),
					'cta'         => array( 'type' => 'text', 'label' => 'Button Text (View All)', 'placeholder' => 'View All Reviews' ),
					'cta_url'     => array( 'type' => 'url', 'label' => 'Button Link (View All)', 'placeholder' => '/about' ),
					'cta_icon'    => array( 'type' => 'icon', 'label' => 'Button Icon (View All)' ),
					'parent_page' => array(
						'type'    => 'select',
						'label'   => 'Parent Page (shows ALL reviews)',
						'default' => 'home',
						'options' => VTech_Pages::choices(),
					),
					'items'       => array(
						'type'       => 'repeater',
						'label'      => 'Reviews',
						'item_label' => 'Review',
						'fields'     => array(
							'quote'   => array( 'type' => 'textarea', 'label' => 'Quote' ),
							'name'    => array( 'type' => 'text', 'label' => 'Name' ),
							'role'    => array( 'type' => 'text', 'label' => 'Role' ),
							'avatar'  => array( 'type' => 'image', 'label' => 'Avatar' ),
							'rating'  => array( 'type' => 'number', 'label' => 'Rating (1-5)', 'default' => 5 ),
							'feature' => array( 'type' => 'toggle', 'label' => 'Add to Feature (show on other pages)' ),
						),
					),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Testimonials',
				'title'       => 'What Our Clients Say',
				'description' => 'Trusted by businesses and individuals around the world.',
				'image'       => '',
				'cta_visible' => 0,
				'cta'         => 'View All Reviews',
				'cta_url'     => '/about',
				'cta_icon'    => 'arrow-right',
				'parent_page' => 'home',
				'items'       => array(
					array( 'quote' => 'Tech Easy delivered an amazing website for our business. The team is professional, responsive and really understands our needs.', 'name' => 'Rohit Sharma', 'role' => 'Founder, FreshBite', 'avatar' => 'https://placehold.co/80x80/121a40/ffffff?text=RS', 'rating' => 5, 'feature' => 0 ),
					array( 'quote' => 'The mobile app they built for us is fantastic. It is fast, user-friendly and has greatly improved our customer engagement.', 'name' => 'Priya Patel', 'role' => 'CEO, FitLife', 'avatar' => 'https://placehold.co/80x80/121a40/ffffff?text=PP', 'rating' => 5, 'feature' => 0 ),
					array( 'quote' => 'Highly recommend Tech Easy. Their support is excellent and the quality of their work is top-notch.', 'name' => 'Amit Verma', 'role' => 'Co-Founder, GrowTech', 'avatar' => 'https://placehold.co/80x80/121a40/ffffff?text=AV', 'rating' => 5, 'feature' => 0 ),
				),
				'placement'   => array(
					'home'      => array( 'show' => 1, 'order' => 5 ),
					'portfolio' => array( 'show' => 1, 'order' => 3 ),
				),
			),
		)
	);

	/* ---- Reusable: CTA band (above footer) ---- */
	VTech_Sections::register(
		array(
			'id'       => 'cta',
			'label'    => 'CTA Band',
			'group'    => 'reusable',
			'page'     => 'home',
			'icon'     => 'dashicons-megaphone',
			'fields'   => array_merge(
				array(
					'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
					'title'       => array( 'type' => 'text', 'label' => 'Title' ),
					'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
					'placeholder' => array( 'type' => 'text', 'label' => 'Input placeholder' ),
					'button'      => array( 'type' => 'text', 'label' => 'Button Text' ),
				),
				vtech_placement_schema()
			),
			'defaults' => array(
				'eyebrow'     => 'Stay Updated',
				'title'       => 'Want More Tech Insights?',
				'description' => 'Subscribe to our blog and never miss an update.',
				'placeholder' => 'Enter your email address',
				'button'      => 'Subscribe',
				'placement'   => array(
					'home'      => array( 'show' => 1, 'order' => 10 ),
					'about'     => array( 'show' => 1, 'order' => 10 ),
					'portfolio' => array( 'show' => 1, 'order' => 10 ),
					'contact'   => array( 'show' => 1, 'order' => 10 ),
					'blog'      => array( 'show' => 1, 'order' => 10 ),
					'pricing'   => array( 'show' => 1, 'order' => 10 ),
					'services'  => array( 'show' => 1, 'order' => 10 ),
				),
			),
		)
	);

	/*
	 * Every page must own at least one section so its admin menu always has
	 * that page's own fields. Pages already owning a section (services,
	 * portfolio, home, ...) are skipped; the rest get a generic content
	 * section (empty by default, so nothing changes on the frontend until the
	 * admin fills it in).
	 */
	$owned = array();
	foreach ( VTech_Sections::in_group( 'reusable' ) as $def ) {
		if ( ! empty( $def['page'] ) ) {
			$owned[ $def['page'] ] = true;
		}
	}
	foreach ( VTech_Pages::all() as $slug => $page ) {
		$id = $slug . '_content';
		if ( isset( $owned[ $slug ] ) || VTech_Sections::get( $id ) ) {
			continue;
		}
		VTech_Sections::register(
			array(
				'id'       => $id,
				'label'    => $page['label'] . ' Content',
				'group'    => 'reusable',
				'page'     => $slug,
				'icon'     => 'dashicons-welcome-write-blog',
				'fields'   => array_merge( vtech_custom_section_schema(), vtech_placement_schema() ),
				'defaults' => array_merge(
					vtech_custom_section_defaults(),
					array( 'placement' => array( $slug => array( 'show' => 1, 'order' => 2 ) ) )
				),
			)
		);
	}

	/**
	 * Let add-ons register more sections after the core ones.
	 */
	do_action( 'vtech_register_sections' );
}

/**
 * Restore starter service content once for installations that saved the old
 * empty Services form, without replacing any populated service cards.
 */
function vtech_migrate_empty_services_content() {
	if ( get_option( 'vtech_services_content_migrated' ) ) {
		return;
	}

	$def = VTech_Sections::get( 'services' );
	if ( ! $def || empty( $def['defaults'] ) ) {
		return;
	}

	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) || empty( $content['sections']['services'] ) || ! is_array( $content['sections']['services'] ) ) {
		update_option( 'vtech_services_content_migrated', 1 );
		return;
	}

	$stored   = $content['sections']['services'];
	$defaults = $def['defaults'];
	$changed  = false;

	foreach ( array( 'eyebrow', 'title', 'title_accent', 'description' ) as $key ) {
		if ( empty( $stored[ $key ] ) && ! empty( $defaults[ $key ] ) ) {
			$stored[ $key ] = $defaults[ $key ];
			$changed        = true;
		}
	}

	if ( empty( $stored['items'] ) && ! empty( $defaults['items'] ) ) {
		$stored['items'] = $defaults['items'];
		$changed         = true;
	}

	if ( empty( $stored['parent_page'] ) && ! empty( $defaults['parent_page'] ) ) {
		$stored['parent_page'] = $defaults['parent_page'];
		$changed               = true;
	}

	if ( $changed ) {
		$content['sections']['services'] = $stored;
		update_option( VTECH_CORE_OPTION, $content );
	}

	update_option( 'vtech_services_content_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_empty_services_content', 21 );

/**
 * Seed Process steps and Testimonials only for older installations that
 * stored the formerly empty section defaults.
 */
function vtech_migrate_process_testimonial_starters() {
	if ( get_option( 'vtech_process_testimonial_starters_migrated' ) ) {
		return;
	}

	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) || ! isset( $content['sections'] ) || ! is_array( $content['sections'] ) ) {
		update_option( 'vtech_process_testimonial_starters_migrated', 1 );
		return;
	}

	$changed = false;
	foreach ( array( 'process' => 'steps', 'testimonials' => 'items' ) as $section_id => $field ) {
		$def = VTech_Sections::get( $section_id );
		if ( ! $def || empty( $def['defaults'][ $field ] ) || ! isset( $content['sections'][ $section_id ] ) || ! is_array( $content['sections'][ $section_id ] ) ) {
			continue;
		}
		if ( empty( $content['sections'][ $section_id ][ $field ] ) ) {
			$content['sections'][ $section_id ][ $field ] = $def['defaults'][ $field ];
			$changed = true;
		}
	}

	if ( $changed ) {
		update_option( VTECH_CORE_OPTION, $content );
	}
	update_option( 'vtech_process_testimonial_starters_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_process_testimonial_starters', 22 );

/**
 * Undo the initial "all cards featured" seed only when it is still untouched.
 */
function vtech_migrate_service_feature_defaults() {
	if ( get_option( 'vtech_service_feature_defaults_migrated' ) ) {
		return;
	}

	$expected_titles = array(
		'Web Development',
		'Mobile App Development',
		'Cloud Solutions',
		'Custom Software',
		'IT Support & Maintenance',
		'UI/UX Design',
	);
	$content = get_option( VTECH_CORE_OPTION, array() );
	$items   = isset( $content['sections']['services']['items'] ) && is_array( $content['sections']['services']['items'] )
		? $content['sections']['services']['items']
		: array();

	if ( count( $items ) === count( $expected_titles ) ) {
		$untouched_seed = true;
		foreach ( $items as $index => $item ) {
			if ( ! isset( $item['title'], $item['feature'] ) || $expected_titles[ $index ] !== $item['title'] || empty( $item['feature'] ) ) {
				$untouched_seed = false;
				break;
			}
		}

		if ( $untouched_seed ) {
			foreach ( $items as &$item ) {
				$item['feature'] = 0;
			}
			unset( $item );
			$content['sections']['services']['items'] = $items;
			update_option( VTECH_CORE_OPTION, $content );
		}
	}

	update_option( 'vtech_service_feature_defaults_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_service_feature_defaults', 22 );

/**
 * Seed the portfolio categories and project cards for installations that
 * previously saved an empty Projects section.
 */
function vtech_migrate_empty_projects_content() {
	if ( get_option( 'vtech_projects_content_migrated' ) ) {
		return;
	}

	$def = VTech_Sections::get( 'projects' );
	if ( ! $def || empty( $def['defaults'] ) ) {
		return;
	}

	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) || empty( $content['sections']['projects'] ) || ! is_array( $content['sections']['projects'] ) ) {
		update_option( 'vtech_projects_content_migrated', 1 );
		return;
	}

	$stored   = $content['sections']['projects'];
	$defaults = $def['defaults'];
	$changed  = false;

	foreach ( array( 'eyebrow', 'title', 'description', 'cta', 'parent_page' ) as $key ) {
		if ( empty( $stored[ $key ] ) && ! empty( $defaults[ $key ] ) ) {
			$stored[ $key ] = $defaults[ $key ];
			$changed        = true;
		}
	}

	foreach ( array( 'categories', 'items' ) as $key ) {
		if ( empty( $stored[ $key ] ) && ! empty( $defaults[ $key ] ) ) {
			$stored[ $key ] = $defaults[ $key ];
			$changed        = true;
		}
	}

	if ( $changed ) {
		$content['sections']['projects'] = $stored;
		update_option( VTECH_CORE_OPTION, $content );
	}

	update_option( 'vtech_projects_content_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_empty_projects_content', 23 );

/**
 * Convert projects saved with the old single category and badge color fields.
 */
function vtech_migrate_project_categories() {
	if ( get_option( 'vtech_project_categories_migrated' ) ) {
		return;
	}

	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) || empty( $content['sections']['projects']['items'] ) || ! is_array( $content['sections']['projects']['items'] ) ) {
		update_option( 'vtech_project_categories_migrated', 1 );
		return;
	}

	$changed = false;
	foreach ( $content['sections']['projects']['items'] as &$item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}
		if ( empty( $item['categories'] ) && ! empty( $item['tag'] ) ) {
			$item['categories'] = array( sanitize_text_field( $item['tag'] ) );
			$changed            = true;
		}
		if ( isset( $item['tag'] ) ) {
			unset( $item['tag'] );
			$changed = true;
		}
		if ( isset( $item['tag_color'] ) ) {
			unset( $item['tag_color'] );
			$changed = true;
		}
	}
	unset( $item );

	if ( $changed ) {
		update_option( VTECH_CORE_OPTION, $content );
	}

	update_option( 'vtech_project_categories_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_project_categories', 24 );

/**
 * Add feature flag to existing portfolio items that were saved before the field existed.
 */
function vtech_migrate_project_feature_flag() {
	if ( get_option( 'vtech_project_feature_flag_migrated' ) ) {
		return;
	}
	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) || empty( $content['sections']['projects']['items'] ) || ! is_array( $content['sections']['projects']['items'] ) ) {
		update_option( 'vtech_project_feature_flag_migrated', 1 );
		return;
	}
	$changed = false;
	foreach ( $content['sections']['projects']['items'] as &$item ) {
		if ( is_array( $item ) && ! array_key_exists( 'feature', $item ) ) {
			$item['feature'] = 0;
			$changed = true;
		}
	}
	unset( $item );
	if ( $changed ) {
		update_option( VTECH_CORE_OPTION, $content );
	}
	update_option( 'vtech_project_feature_flag_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_project_feature_flag', 24 );

/**
 * Initialize Case Study content and make its Feature toggle control visibility.
 */
function vtech_migrate_case_study_content() {
	if ( get_option( 'vtech_case_study_content_v2_migrated' ) ) {
		return;
	}

	$def = VTech_Sections::get( 'case_study' );
	if ( ! $def || empty( $def['defaults'] ) ) {
		return;
	}

	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) ) {
		$content = array();
	}
	if ( ! isset( $content['sections'] ) || ! is_array( $content['sections'] ) ) {
		$content['sections'] = array();
	}

	$stored   = isset( $content['sections']['case_study'] ) && is_array( $content['sections']['case_study'] )
		? $content['sections']['case_study']
		: array();
	$defaults = $def['defaults'];

	foreach ( array( 'image', 'brand', 'badge', 'eyebrow', 'title', 'description', 'tech', 'stats', 'button', 'button_text', 'button_url', 'button_icon' ) as $key ) {
		if ( ! isset( $stored[ $key ] ) || ( is_array( $stored[ $key ] ) && empty( $stored[ $key ] ) ) || ( ! is_array( $stored[ $key ] ) && '' === $stored[ $key ] ) ) {
			$stored[ $key ] = $defaults[ $key ];
		}
	}
	$stored['feature'] = 1;
	$stored['parent_page'] = 'portfolio';

	$placement = isset( $stored['placement'] ) && is_array( $stored['placement'] ) ? $stored['placement'] : array();
	$portfolio_placement = isset( $placement['portfolio'] ) && is_array( $placement['portfolio'] )
		? $placement['portfolio']
		: array();
	$portfolio_placement['show']  = 1;
	$portfolio_placement['order'] = isset( $portfolio_placement['order'] ) ? (int) $portfolio_placement['order'] : 2;
	$placement['portfolio'] = $portfolio_placement;
	$stored['placement'] = $placement;

	$content['sections']['case_study'] = $stored;
	update_option( VTECH_CORE_OPTION, $content );
	update_option( 'vtech_case_study_content_v2_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_case_study_content', 25 );

add_action( 'init', 'vtech_register_sections', 20 );

/**
 * Ensure the projects section is visible on the portfolio page for existing installs.
 */
function vtech_migrate_projects_portfolio_placement() {
	if ( get_option( 'vtech_projects_portfolio_placement_migrated' ) ) {
		return;
	}
	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( is_array( $content ) && isset( $content['sections']['projects']['placement']['portfolio'] ) ) {
		$content['sections']['projects']['placement']['portfolio']['show'] = 1;
		update_option( VTECH_CORE_OPTION, $content );
	}
	update_option( 'vtech_projects_portfolio_placement_migrated', 1 );
}
add_action( 'init', 'vtech_migrate_projects_portfolio_placement', 26 );

