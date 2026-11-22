<?php
/**
 * Chat assistant content and action settings.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'vtech_admin_submenus',
	function ( $parent, $cap ) {
		add_submenu_page(
			$parent,
			__( 'Chat Assistant', 'vtech-core' ),
			__( 'Chat Assistant', 'vtech-core' ),
			$cap,
			'vtech-chatbot',
			'vtech_render_chatbot_page'
		);
	},
	25,
	2
);

/**
 * Sanitize a chatbot icon name or uploaded icon URL.
 *
 * @param mixed $value submitted value.
 * @return string
 */
function vtech_chatbot_sanitize_icon( $value ) {
	$value = is_string( $value ) ? trim( $value ) : '';
	if ( '' === $value ) {
		return '';
	}
	if ( preg_match( '#^(https?://|/)#i', $value ) ) {
		return vtech_chatbot_sanitize_link( $value );
	}

	$value   = sanitize_key( $value );
	$allowed = array_merge( vtech_feather_icons(), array( 'whatsapp', 'telegram' ) );
	return in_array( $value, $allowed, true ) ? $value : '';
}

/**
 * Sanitize a chatbot URL while allowing internal routes and anchors.
 *
 * @param mixed $value submitted URL.
 * @return string
 */
function vtech_chatbot_sanitize_link( $value ) {
	$value = is_string( $value ) ? trim( $value ) : '';
	if ( '' === $value || 0 === strpos( $value, '//' ) ) {
		return '';
	}
	if ( 0 === strpos( $value, '#' ) || 0 === strpos( $value, '/' ) ) {
		return sanitize_text_field( $value );
	}
	return esc_url_raw( $value, array( 'http', 'https', 'mailto', 'tel' ) );
}

/**
 * Save chatbot settings after capability and nonce checks.
 *
 * @return void
 */
function vtech_save_chatbot() {
	if ( ! isset( $_POST['vtech_chatbot_nonce'] ) || ! wp_verify_nonce( wp_unslash( $_POST['vtech_chatbot_nonce'] ), 'vtech_save_chatbot' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$raw      = isset( $_POST['chatbot'] ) && is_array( $_POST['chatbot'] ) ? wp_unslash( $_POST['chatbot'] ) : array();
	$defaults = vtech_chatbot_default_config();
	$data     = array(
		'welcome'           => isset( $raw['welcome'] ) ? sanitize_textarea_field( $raw['welcome'] ) : $defaults['welcome'],
		'quick_questions'   => array(),
		'faqs'              => array(),
		'lead_prompts'      => array(),
		'fallback'          => array(),
		'handoff_keywords'  => isset( $raw['handoff_keywords'] ) ? sanitize_text_field( $raw['handoff_keywords'] ) : $defaults['handoff_keywords'],
		'off_topic_keywords' => isset( $raw['off_topic_keywords'] ) ? sanitize_text_field( $raw['off_topic_keywords'] ) : $defaults['off_topic_keywords'],
		'actions'           => array(),
		'contact_action'    => array(),
	);

	if ( ! empty( $raw['quick_questions'] ) && is_array( $raw['quick_questions'] ) ) {
		foreach ( $raw['quick_questions'] as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$label  = isset( $item['label'] ) ? sanitize_text_field( $item['label'] ) : '';
			$action = isset( $item['action'] ) && 'contact' === $item['action'] ? 'contact' : 'question';
			$query  = isset( $item['question'] ) ? sanitize_text_field( $item['question'] ) : '';
			if ( '' === $label || ( 'question' === $action && '' === $query ) ) {
				continue;
			}
			$data['quick_questions'][] = array(
				'label'    => $label,
				'question' => $query,
				'action'   => $action,
			);
		}
	}

	if ( ! empty( $raw['faqs'] ) && is_array( $raw['faqs'] ) ) {
		foreach ( $raw['faqs'] as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$question = isset( $item['question'] ) ? sanitize_text_field( $item['question'] ) : '';
			$answer   = isset( $item['answer'] ) ? sanitize_textarea_field( $item['answer'] ) : '';
			if ( '' === $question || '' === $answer ) {
				continue;
			}
			$data['faqs'][] = array(
				'question'   => $question,
				'keywords'   => isset( $item['keywords'] ) ? sanitize_text_field( $item['keywords'] ) : '',
				'answer'     => $answer,
				'link_label' => isset( $item['link_label'] ) ? sanitize_text_field( $item['link_label'] ) : '',
				'link_url'   => isset( $item['link_url'] ) ? vtech_chatbot_sanitize_link( $item['link_url'] ) : '',
			);
		}
	}

	if ( isset( $raw['lead_prompts'] ) && is_array( $raw['lead_prompts'] ) ) {
		foreach ( $raw['lead_prompts'] as $prompt ) {
			$data['lead_prompts'][] = is_string( $prompt ) ? sanitize_text_field( $prompt ) : '';
		}
	}
	if ( count( $data['lead_prompts'] ) < 4 ) {
		$data['lead_prompts'] = array_slice( array_merge( $data['lead_prompts'], $defaults['lead_prompts'] ), 0, 4 );
	}

	$fallback_raw = isset( $raw['fallback'] ) && is_array( $raw['fallback'] ) ? $raw['fallback'] : array();
	foreach ( array( 'unknown', 'off_topic', 'human' ) as $key ) {
		$value                = isset( $fallback_raw[ $key ] ) ? sanitize_textarea_field( $fallback_raw[ $key ] ) : '';
		$data['fallback'][ $key ] = '' !== $value ? $value : $defaults['fallback'][ $key ];
	}

	if ( ! empty( $raw['actions'] ) && is_array( $raw['actions'] ) ) {
		foreach ( $raw['actions'] as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$label = isset( $item['label'] ) ? sanitize_text_field( $item['label'] ) : '';
			$icon  = isset( $item['icon'] ) ? vtech_chatbot_sanitize_icon( $item['icon'] ) : '';
			$url   = isset( $item['url'] ) ? vtech_chatbot_sanitize_link( $item['url'] ) : '';
			if ( '' === $label || '' === $icon || '' === $url ) {
				continue;
			}
			$data['actions'][] = array(
				'label' => $label,
				'icon'  => $icon,
				'url'   => $url,
			);
		}
	}

	$contact_raw = isset( $raw['contact_action'] ) && is_array( $raw['contact_action'] ) ? $raw['contact_action'] : array();
	$behavior    = isset( $contact_raw['behavior'] ) && 'redirect' === $contact_raw['behavior'] ? 'redirect' : 'chat_form';
	$redirect    = isset( $contact_raw['redirect_url'] ) ? vtech_chatbot_sanitize_link( $contact_raw['redirect_url'] ) : '';
	if ( 'redirect' === $behavior && '' === $redirect ) {
		add_settings_error( 'vtech_chatbot', 'redirect_required', __( 'Add a valid redirect URL or select the in-chat form option.', 'vtech-core' ), 'error' );
		return;
	}

	$data['contact_action'] = array(
		'label'        => isset( $contact_raw['label'] ) ? sanitize_text_field( $contact_raw['label'] ) : $defaults['contact_action']['label'],
		'icon'         => isset( $contact_raw['icon'] ) ? vtech_chatbot_sanitize_icon( $contact_raw['icon'] ) : $defaults['contact_action']['icon'],
		'behavior'     => $behavior,
		'redirect_url' => $redirect,
	);
	if ( '' === $data['contact_action']['label'] ) {
		$data['contact_action']['label'] = $defaults['contact_action']['label'];
	}
	if ( '' === $data['contact_action']['icon'] ) {
		$data['contact_action']['icon'] = $defaults['contact_action']['icon'];
	}

	vtech_save_section( 'chatbot', $data );
	add_settings_error( 'vtech_chatbot', 'saved', __( 'Chat assistant settings saved.', 'vtech-core' ), 'success' );
}

/**
 * Render the Chat Assistant CMS screen.
 *
 * @return void
 */
function vtech_render_chatbot_page() {
	if ( isset( $_POST['vtech_chatbot_nonce'] ) ) {
		vtech_save_chatbot();
	}

	$content  = vtech_get_content();
	$defaults = vtech_chatbot_default_config();
	$stored_chatbot = isset( $content['chatbot'] ) && is_array( $content['chatbot'] ) ? $content['chatbot'] : array();
	$chatbot        = wp_parse_args( $stored_chatbot, $defaults );
	foreach ( array( 'welcome', 'handoff_keywords', 'off_topic_keywords' ) as $string_key ) {
		if ( ! isset( $chatbot[ $string_key ] ) || ! is_string( $chatbot[ $string_key ] ) ) {
			$chatbot[ $string_key ] = $defaults[ $string_key ];
		}
	}
	foreach ( array( 'quick_questions', 'faqs', 'lead_prompts', 'actions' ) as $list_key ) {
		if ( ! isset( $chatbot[ $list_key ] ) || ! is_array( $chatbot[ $list_key ] ) ) {
			$chatbot[ $list_key ] = $defaults[ $list_key ];
		}
	}
	foreach ( $defaults['lead_prompts'] as $i => $prompt ) {
		if ( ! isset( $chatbot['lead_prompts'][ $i ] ) || ! is_string( $chatbot['lead_prompts'][ $i ] ) ) {
			$chatbot['lead_prompts'][ $i ] = $prompt;
		}
	}
	$chatbot['lead_prompts'] = array_slice( $chatbot['lead_prompts'], 0, 4 );
	$fallback = wp_parse_args( is_array( $chatbot['fallback'] ) ? $chatbot['fallback'] : array(), $defaults['fallback'] );
	$contact_action = wp_parse_args( is_array( $chatbot['contact_action'] ) ? $chatbot['contact_action'] : array(), $defaults['contact_action'] );
	$chatbot['contact_action'] = $contact_action;
	?>
	<div class="wrap vtech-wrap">
		<div class="vtech-head">
			<h1><span class="dashicons dashicons-format-chat"></span> Chat Assistant</h1>
			<p class="vtech-sub">Manage chatbot answers, quick questions, lead prompts, action icons and contact behavior. Changes are returned through the public layout API.</p>
		</div>

		<?php settings_errors( 'vtech_chatbot' ); ?>

		<form method="post" class="vtech-form">
			<?php wp_nonce_field( 'vtech_save_chatbot', 'vtech_chatbot_nonce' ); ?>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Welcome</h2>
				<?php vtech_chatbot_textarea_field( 'chatbot[welcome]', $chatbot['welcome'], 'Welcome message', 2 ); ?>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Quick Questions</h2>
				<p class="vtech-hint">Add, edit, remove or reorder the buttons shown when the chat first opens. Choose whether a button asks a question or opens the chatbot contact form.</p>
				<div class="vtech-repeater" data-repeater="chatbot[quick_questions]">
					<div class="vtech-repeater-items">
						<?php foreach ( $chatbot['quick_questions'] as $i => $item ) { vtech_render_chatbot_quick_row( $i, $item ); } ?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="chatbot-quick">+ Add Quick Question</button>
				</div>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Questions &amp; Answers</h2>
				<p class="vtech-hint">Each answer can include one optional link to a page. Keywords help match different ways visitors ask the same question.</p>
				<div class="vtech-repeater" data-repeater="chatbot[faqs]">
					<div class="vtech-repeater-items">
						<?php foreach ( $chatbot['faqs'] as $i => $faq ) { vtech_render_chatbot_faq_row( $i, $faq ); } ?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="chatbot-faq">+ Add Answer</button>
				</div>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Lead Form Questions</h2>
				<p class="vtech-hint">These are asked one at a time when a visitor chooses to contact your team.</p>
				<?php foreach ( $chatbot['lead_prompts'] as $i => $prompt ) { VTech_Admin::text_field( "chatbot[lead_prompts][$i]", $prompt, 'Question ' . ( $i + 1 ) ); } ?>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Fallback Replies</h2>
				<?php
				vtech_chatbot_textarea_field( 'chatbot[fallback][unknown]', $fallback['unknown'], 'Answer not found', 2 );
				vtech_chatbot_textarea_field( 'chatbot[fallback][off_topic]', $fallback['off_topic'], 'Off-topic question', 2 );
				vtech_chatbot_textarea_field( 'chatbot[fallback][human]', $fallback['human'], 'Human handoff / upset visitor', 2 );
				VTech_Admin::text_field( 'chatbot[handoff_keywords]', $chatbot['handoff_keywords'], 'Human handoff keywords', 'human, team, call me' );
				VTech_Admin::text_field( 'chatbot[off_topic_keywords]', $chatbot['off_topic_keywords'], 'Off-topic keywords', 'weather, cricket, recipe' );
				?>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">After-Enquiry Icons &amp; Links</h2>
				<p class="vtech-hint">Add or remove any number of action icons. Use the icon picker or upload a custom icon image. WhatsApp and Instagram are editable here too.</p>
				<div class="vtech-repeater" data-repeater="chatbot[actions]">
					<div class="vtech-repeater-items">
						<?php foreach ( $chatbot['actions'] as $i => $action ) { vtech_render_chatbot_action_row( $i, $action ); } ?>
					</div>
					<button type="button" class="button button-primary vtech-add" data-target="chatbot-action">+ Add Action Icon</button>
				</div>
			</div>

			<div class="vtech-panel">
				<h2 class="vtech-panel-title">Contact Icon</h2>
				<p class="vtech-hint">Choose exactly one behavior: open the contact form inside this chat or redirect to the URL below.</p>
				<div class="vtech-grid-2">
					<?php
					VTech_Admin::text_field( 'chatbot[contact_action][label]', $chatbot['contact_action']['label'], 'Button label', 'Contact' );
					VTech_Admin::icon_field( 'chatbot[contact_action][icon]', $chatbot['contact_action']['icon'], 'Button icon' );
					VTech_Admin::select_field(
						'chatbot[contact_action][behavior]',
						$chatbot['contact_action']['behavior'],
						'Contact behavior',
						array(
							'chat_form' => 'Open form inside chatbot',
							'redirect'  => 'Redirect to URL',
						)
					);
					VTech_Admin::text_field( 'chatbot[contact_action][redirect_url]', $chatbot['contact_action']['redirect_url'], 'Redirect URL', '/contact#contact-form' );
					?>
				</div>
				<p class="vtech-hint">The redirect URL is used only when “Redirect to URL” is selected.</p>
			</div>

			<?php submit_button( 'Save Chat Assistant' ); ?>
		</form>
	</div>

	<script type="text/html" id="vtech-tmpl-chatbot-quick">
		<?php vtech_render_chatbot_quick_row( '__INDEX__', array( 'label' => '', 'question' => '', 'action' => 'question' ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-chatbot-faq">
		<?php vtech_render_chatbot_faq_row( '__INDEX__', array( 'question' => '', 'keywords' => '', 'answer' => '', 'link_label' => '', 'link_url' => '' ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-chatbot-action">
		<?php vtech_render_chatbot_action_row( '__INDEX__', array( 'label' => '', 'icon' => '', 'url' => '' ) ); ?>
	</script>
	<?php
}

/**
 * Render a chatbot textarea control.
 *
 * @param string $name field name.
 * @param string $value field value.
 * @param string $label field label.
 * @param int    $rows textarea rows.
 * @return void
 */
function vtech_chatbot_textarea_field( $name, $value, $label, $rows = 3 ) {
	?>
	<label class="vtech-field">
		<span class="vtech-label"><?php echo esc_html( $label ); ?></span>
		<textarea name="<?php echo esc_attr( $name ); ?>" rows="<?php echo esc_attr( $rows ); ?>" class="vtech-input"><?php echo esc_textarea( $value ); ?></textarea>
	</label>
	<?php
}

/**
 * Render an editable quick-question row.
 *
 * @param int|string $i row index.
 * @param array      $item row content.
 * @return void
 */
function vtech_render_chatbot_quick_row( $i, $item ) {
	$item = wp_parse_args( is_array( $item ) ? $item : array(), array( 'label' => '', 'question' => '', 'action' => 'question' ) );
	?>
	<div class="vtech-row vtech-col-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main vtech-grid-2">
			<?php
			VTech_Admin::text_field( "chatbot[quick_questions][$i][label]", $item['label'], 'Button label' );
			VTech_Admin::text_field( "chatbot[quick_questions][$i][question]", $item['question'], 'Question to ask' );
			VTech_Admin::select_field( "chatbot[quick_questions][$i][action]", $item['action'], 'Button action', array( 'question' => 'Ask question', 'contact' => 'Open contact form' ) );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * Render an editable FAQ row.
 *
 * @param int|string $i row index.
 * @param array      $faq FAQ content.
 * @return void
 */
function vtech_render_chatbot_faq_row( $i, $faq ) {
	$faq = wp_parse_args( is_array( $faq ) ? $faq : array(), array( 'question' => '', 'keywords' => '', 'answer' => '', 'link_label' => '', 'link_url' => '' ) );
	?>
	<div class="vtech-row vtech-col-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main">
			<div class="vtech-grid-2">
				<?php
				VTech_Admin::text_field( "chatbot[faqs][$i][question]", $faq['question'], 'Visitor question' );
				VTech_Admin::text_field( "chatbot[faqs][$i][keywords]", $faq['keywords'], 'Matching keywords' );
				?>
			</div>
			<?php vtech_chatbot_textarea_field( "chatbot[faqs][$i][answer]", $faq['answer'], 'Answer', 3 ); ?>
			<div class="vtech-grid-2">
				<?php
				VTech_Admin::text_field( "chatbot[faqs][$i][link_label]", $faq['link_label'], 'Optional link label' );
				VTech_Admin::text_field( "chatbot[faqs][$i][link_url]", $faq['link_url'], 'Optional page URL' );
				?>
			</div>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}

/**
 * Render an editable after-enquiry action row.
 *
 * @param int|string $i row index.
 * @param array      $action action content.
 * @return void
 */
function vtech_render_chatbot_action_row( $i, $action ) {
	$action = wp_parse_args( is_array( $action ) ? $action : array(), array( 'label' => '', 'icon' => '', 'url' => '' ) );
	?>
	<div class="vtech-row vtech-col-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main vtech-grid-2">
			<?php
			VTech_Admin::text_field( "chatbot[actions][$i][label]", $action['label'], 'Button label' );
			VTech_Admin::icon_field( "chatbot[actions][$i][icon]", $action['icon'], 'Button icon' );
			VTech_Admin::text_field( "chatbot[actions][$i][url]", $action['url'], 'Destination URL' );
			?>
		</div>
		<button type="button" class="vtech-remove dashicons dashicons-trash" title="Remove"></button>
	</div>
	<?php
}
