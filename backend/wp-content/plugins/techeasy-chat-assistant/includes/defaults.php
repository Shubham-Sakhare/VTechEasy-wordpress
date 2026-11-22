<?php
/**
 * Default chatbot configuration and settings helpers.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Create a guided option row.
 *
 * @param string $id Option identifier.
 * @param string $label Button label.
 * @param string $answer Answer text.
 * @param array  $related Related Q&A identifiers.
 * @param string $action Option action.
 * @return array
 */
function tea_chat_option( $id, $label, $answer, $related = array(), $action = 'answer' ) {
	return array(
		'id'          => $id,
		'label'       => $label,
		'action'      => $action,
		'answer'      => $answer,
		'related_ids' => $related,
	);
}

/**
 * Default settings installed on activation.
 *
 * @return array
 */
function tea_chat_default_settings() {
	$related_general = array( 'timeline', 'pricing', 'support' );

	return array(
		'welcome'       => "Hi! 👋 I'm the Tech Easy AI assistant. How can I help you today?",
		'bot_name'      => 'Tech Easy Assistant',
		'avatar'        => '',
		'primary_color' => '#2563eb',
		'position'      => 'right',
		'quick_questions' => array(
			array(
				'id'       => 'web-development',
				'label'    => 'Web Development',
				'action'   => 'guided',
				'intro'    => 'What would you like to know about Web Development?',
				'answer_id' => '',
				'options'  => array(
					tea_chat_option( 'business-website', 'Business Website', 'We build responsive business websites tailored to your services and audience. We can help with planning, design and development.', $related_general ),
					tea_chat_option( 'ecommerce-website', 'E-commerce Website', 'We create online stores around your products, payments and business workflow. Share what you need and our team will recommend an approach.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'custom-web-app', 'Custom Web App (React)', 'We build custom web applications based on your users, workflow and feature requirements. Our team can help plan the right scope.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'website-redesign', 'Website Redesign', 'We can redesign an existing website and improve its usability, responsiveness and performance. Please share your current website link.', array( 'timeline', 'seo', 'portfolio' ) ),
					tea_chat_option( 'web-other', 'Other', 'Tell us a little about your web project and our team will help you with the next steps.', array(), 'contact' ),
				),
			),
			array(
				'id'       => 'mobile-app',
				'label'    => 'Mobile App',
				'action'   => 'guided',
				'intro'    => 'What would you like to know about Mobile App Development?',
				'answer_id' => '',
				'options'  => array(
					tea_chat_option( 'android-app', 'Android App', 'Yes, we build Android apps around your users, features and business requirements. Tell us what you have in mind for a tailored plan.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'ios-app', 'iOS App', 'Yes, we build iOS apps for iPhone and iPad based on your project requirements. Our team can discuss the best approach for your product.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'cross-platform-app', 'Cross-platform App', 'We can build cross-platform apps to support Android and iOS with a shared codebase. The right choice depends on your features and goals.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'app-support', 'App Support & Updates', 'Yes, we provide ongoing support, updates and maintenance after launch. Support can be tailored to your product needs.', array( 'pricing', 'services', 'timeline' ) ),
					tea_chat_option( 'mobile-other', 'Other', 'Tell us about the mobile app you have in mind and our team will help you plan the next steps.', array(), 'contact' ),
				),
			),
			array(
				'id'       => 'ui-ux-design',
				'label'    => 'UI/UX Design',
				'action'   => 'guided',
				'intro'    => 'What would you like to know about UI/UX Design?',
				'answer_id' => '',
				'options'  => array(
					tea_chat_option( 'website-design', 'Website Design', 'We design clear, responsive website experiences that help visitors find information and take action. We can work with an existing brand or a new direction.', array( 'pricing', 'timeline', 'portfolio' ) ),
					tea_chat_option( 'app-design', 'App Design', 'We design mobile app experiences around your users, features and product goals. We can help shape the experience before development begins.', array( 'pricing', 'timeline', 'support' ) ),
					tea_chat_option( 'redesign-existing-ui', 'Redesign Existing UI', 'We can review an existing website or app and improve its interface and user experience. Share a link or screenshots with our team.', array( 'portfolio', 'pricing', 'timeline' ) ),
					tea_chat_option( 'design-other', 'Other', 'Tell us what you would like designed and our team can discuss the right approach.', array(), 'contact' ),
				),
			),
			array(
				'id'       => 'pricing',
				'label'    => 'Pricing',
				'action'   => 'guided',
				'intro'    => 'What would you like to know about project pricing?',
				'answer_id' => '',
				'options'  => array(
					tea_chat_option( 'website-cost', 'Website Cost', 'Website cost depends on the pages, features and design you need. Share your requirements and our team will send you a free quote.', array( 'timeline', 'services', 'support' ) ),
					tea_chat_option( 'mobile-app-cost', 'Mobile App Cost', 'App cost depends on the platforms, features and integrations involved. Our team will share a free quote after understanding your requirements.', array( 'timeline', 'services', 'support' ) ),
					tea_chat_option( 'custom-project-quote', 'Custom Project Quote', 'We provide a free quote after learning about your goals and project scope. Tell us briefly what you are planning.', array( 'services', 'timeline', 'support' ) ),
					tea_chat_option( 'pricing-other', 'Other', 'Tell us what you would like priced and our team will guide you. We do not provide estimates without understanding the project scope.', array(), 'contact' ),
				),
			),
			array(
				'id'       => 'project-timeline',
				'label'    => 'Project Timeline',
				'action'   => 'guided',
				'intro'    => 'What type of project timeline would you like to know about?',
				'answer_id' => '',
				'options'  => array(
					tea_chat_option( 'small-website-timeline', 'Small Website', 'A small website may take around 1-2 weeks. The exact timeline depends on content, design and required features.', array( 'pricing', 'services', 'support' ) ),
					tea_chat_option( 'large-website-timeline', 'Large Website', 'A larger website may take around 4-8 weeks. We confirm a more accurate timeline after discussing your requirements.', array( 'pricing', 'services', 'support' ) ),
					tea_chat_option( 'mobile-app-timeline', 'Mobile App', 'Mobile app timelines depend on platforms, features and integrations. Share your idea and our team will confirm an estimate.', array( 'pricing', 'services', 'support' ) ),
					tea_chat_option( 'timeline-other', 'Other', 'Tell us what you are planning and our team can help estimate the project timeline.', array(), 'contact' ),
				),
			),
			array(
				'id'        => 'talk-to-team',
				'label'     => 'Talk to Our Team',
				'action'    => 'contact',
				'intro'     => '',
				'answer_id' => '',
				'options'   => array(),
			),
		),
		'faqs'          => array(
			array( 'id' => 'services', 'question' => 'What services do you offer?', 'answer' => 'We offer web development, mobile app development, UI/UX design, automation and ongoing support. Our team can help identify the right service for your project.', 'keywords' => 'services, web development, mobile app, UI UX, automation, support', 'related_ids' => array( 'portfolio', 'timeline', 'pricing' ) ),
			array( 'id' => 'timeline', 'question' => 'How long does a project take?', 'answer' => 'A small website may take around 1-2 weeks and a larger website around 4-8 weeks. The exact timeline depends on your requirements.', 'keywords' => 'timeline, duration, how long, weeks, delivery', 'related_ids' => array( 'pricing', 'services', 'support' ) ),
			array( 'id' => 'pricing', 'question' => 'How much does a project cost?', 'answer' => 'Cost depends on scope, features and design. Share your requirements and our team will provide a free quote; we do not invent prices before reviewing a project.', 'keywords' => 'price, pricing, cost, budget, quote, charges', 'related_ids' => array( 'services', 'timeline', 'support' ) ),
			array( 'id' => 'support', 'question' => 'Do you provide support after launch?', 'answer' => 'Yes, we provide ongoing support, updates and maintenance after launch. The support plan can be tailored to your project.', 'keywords' => 'support, maintenance, after launch, updates', 'related_ids' => array( 'services', 'timeline', 'pricing' ) ),
			array( 'id' => 'portfolio', 'question' => 'Can I see your previous work?', 'answer' => 'Yes, you can explore selected projects in our portfolio and discuss examples relevant to your needs.', 'keywords' => 'portfolio, previous work, past work, projects, examples', 'related_ids' => array( 'services', 'pricing', 'timeline' ) ),
			array( 'id' => 'seo', 'question' => 'Do you offer SEO?', 'answer' => 'We build SEO-friendly websites and can support on-page SEO improvements. Tell us about your website and goals.', 'keywords' => 'seo, search engine, on page seo, google ranking', 'related_ids' => array( 'services', 'portfolio', 'pricing' ) ),
			array( 'id' => 'location', 'question' => 'Where are you located?', 'answer' => "We're based in Hyderabad, India, and work with clients everywhere through online meetings and calls.", 'keywords' => 'location, located, based, office, Hyderabad', 'related_ids' => array( 'services', 'process', 'contact' ) ),
			array( 'id' => 'process', 'question' => 'How do I get started?', 'answer' => "It's simple: Discuss, Plan, Develop, Launch. We start with a free consultation to understand your requirements.", 'keywords' => 'get started, process, consultation, book, discuss plan develop launch', 'related_ids' => array( 'services', 'pricing', 'timeline' ) ),
			array( 'id' => 'contact', 'question' => 'How can I contact your team?', 'answer' => 'Choose Contact below to share your enquiry with our team, or use one of the contact links at the bottom of the chat.', 'keywords' => 'contact, team, human, call, speak, email', 'related_ids' => array( 'services', 'pricing', 'timeline' ) ),
			array( 'id' => 'security', 'question' => 'Is my project information confidential?', 'answer' => 'We treat project and client information as confidential and use submitted details to respond to your enquiry.', 'keywords' => 'data safe, confidential, privacy, security, secure', 'related_ids' => array( 'services', 'process', 'contact' ) ),
		),
		'lead_questions' => array(
			'service'   => 'Which service are you interested in?',
			'name'      => 'May I know your name?',
			'email'     => 'What is your email address?',
			'mobile'    => 'What is your mobile number?',
			'interest'  => 'What do you want to know about?',
			'message'   => 'Please share a short message about your project. This is optional.',
		),
		'fallback'      => "I'm not sure about that. Please share your details and our team will contact you shortly.",
		'actions'       => array(
			array( 'id' => 'whatsapp', 'icon' => 'whatsapp', 'icon_url' => '', 'label' => 'WhatsApp', 'url' => 'https://wa.me/919096337434' ),
			array( 'id' => 'instagram', 'icon' => 'instagram', 'icon_url' => '', 'label' => 'Instagram', 'url' => 'https://www.instagram.com/vtecheasy/?hl=en' ),
			array( 'id' => 'contact', 'icon' => 'contact', 'icon_url' => '', 'label' => 'Contact', 'url' => '/contact#contact-form' ),
		),
		'notification_emails' => 'vtecheasy@gmail.com',
		'webhook_url'          => '',
		'allowed_domains'      => array(),
		'delete_data_on_uninstall' => 0,
	);
}

/**
 * Return the current chatbot configuration with missing top-level values filled.
 *
 * @return array
 */
function tea_chat_get_settings() {
	$stored = get_option( TEA_CHAT_OPTION, array() );
	if ( ! is_array( $stored ) ) {
		$stored = array();
	}
	return array_merge( tea_chat_default_settings(), $stored );
}

