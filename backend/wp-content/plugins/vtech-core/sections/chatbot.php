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
			$action = isset( $item['action'] ) && in_array( $item['action'], array( 'flow', 'question', 'contact' ), true ) ? $item['action'] : 'question';
			$query  = isset( $item['question'] ) ? sanitize_text_field( $item['question'] ) : '';
			if ( '' === $label || ( 'question' === $action && '' === $query ) ) {
				continue;
			}
			$quick_item = array(
				'label'    => $label,
				'question' => $query,
				'action'   => $action,
				'intro'    => isset( $item['intro'] ) ? sanitize_textarea_field( $item['intro'] ) : '',
				'options'  => array(),
			);
			if ( 'flow' === $action && ! empty( $item['options'] ) && is_array( $item['options'] ) ) {
				$other_option = null;
				foreach ( $item['options'] as $option ) {
					if ( ! is_array( $option ) ) {
						continue;
					}
					$option_label  = isset( $option['label'] ) ? sanitize_text_field( $option['label'] ) : '';
					$option_answer = isset( $option['answer'] ) ? sanitize_textarea_field( $option['answer'] ) : '';
					if ( '' === $option_label || '' === $option_answer ) {
						continue;
					}
					$option_data = array(
						'label'      => $option_label,
						'answer'     => $option_answer,
						'kind'       => isset( $option['kind'] ) && 'other' === $option['kind'] ? 'other' : 'answer',
						'link_label' => isset( $option['link_label'] ) ? sanitize_text_field( $option['link_label'] ) : '',
						'link_url'   => isset( $option['link_url'] ) ? vtech_chatbot_sanitize_link( $option['link_url'] ) : '',
					);
					if ( 'other' === $option_data['kind'] ) {
						if ( null === $other_option ) {
							$other_option = $option_data;
						}
					} else {
						$quick_item['options'][] = $option_data;
					}
				}
				if ( null === $other_option ) {
					$other_option = array(
						'label'      => 'Other',
						'answer'     => 'Please tell us a little more about what you need. Our team can help with a custom request.',
						'kind'       => 'other',
						'link_label' => '',
						'link_url'   => '',
					);
				}
				$quick_item['options'][] = $other_option;
			} elseif ( 'flow' === $action ) {
				$quick_item['options'][] = array(
					'label'      => 'Other',
					'answer'     => 'Please tell us a little more about what you need. Our team can help with a custom request.',
					'kind'       => 'other',
					'link_label' => '',
					'link_url'   => '',
				);
			}
			$data['quick_questions'][] = $quick_item;
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
	if ( isset( $contact_raw['redirect_enabled'] ) || isset( $contact_raw['chat_form_enabled'] ) ) {
		$redirect_enabled = ! empty( $contact_raw['redirect_enabled'] );
		$form_enabled     = ! empty( $contact_raw['chat_form_enabled'] );
		if ( $redirect_enabled && $form_enabled ) {
			add_settings_error( 'vtech_chatbot', 'contact_mode_conflict', __( 'Turn on only one Contact behavior.', 'vtech-core' ), 'error' );
			return;
		}
		$behavior = $redirect_enabled ? 'redirect' : 'chat_form';
	} else {
		$behavior = isset( $contact_raw['behavior'] ) && 'redirect' === $contact_raw['behavior'] ? 'redirect' : 'chat_form';
	}
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
	$chatbot        = vtech_chatbot_resolve_config( $stored_chatbot );
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
				<p class="vtech-hint">Add, edit, remove or reorder the buttons shown when the chat first opens. A guided flow shows its intro, answers one selected option at a time, and always places Other last. The Other option shows the configured Contact action.</p>
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
				<p class="vtech-hint">Turn on exactly one option. Selecting one automatically turns the other off.</p>
				<div class="vtech-grid-2">
					<?php
					VTech_Admin::text_field( 'chatbot[contact_action][label]', $chatbot['contact_action']['label'], 'Button label', 'Contact' );
					VTech_Admin::icon_field( 'chatbot[contact_action][icon]', $chatbot['contact_action']['icon'], 'Button icon' );
					?>
				</div>
				<div class="vtech-grid-2 vtech-chatbot-contact-modes">
					<label class="vtech-field vtech-toggle">
						<span class="vtech-label">URL redirect</span>
						<span class="vtech-switch">
							<input
								type="checkbox"
								name="chatbot[contact_action][redirect_enabled]"
								value="1"
								class="vtech-chatbot-mode"
								data-mode="redirect"
								<?php checked( 'redirect', $chatbot['contact_action']['behavior'] ); ?>
							/>
							<span class="vtech-slider"></span>
						</span>
					</label>
					<label class="vtech-field vtech-toggle">
						<span class="vtech-label">Enquiry form in chat</span>
						<span class="vtech-switch">
							<input
								type="checkbox"
								name="chatbot[contact_action][chat_form_enabled]"
								value="1"
								class="vtech-chatbot-mode"
								data-mode="chat_form"
								<?php checked( 'chat_form', $chatbot['contact_action']['behavior'] ); ?>
							/>
							<span class="vtech-slider"></span>
						</span>
					</label>
				</div>
				<div class="vtech-chatbot-redirect-url" <?php echo 'redirect' === $chatbot['contact_action']['behavior'] ? '' : 'hidden'; ?>>
					<?php VTech_Admin::text_field( 'chatbot[contact_action][redirect_url]', $chatbot['contact_action']['redirect_url'], 'Redirect URL', '/contact#contact-form' ); ?>
				</div>
			</div>

			<?php submit_button( 'Save Chat Assistant' ); ?>
		</form>
	</div>

	<script type="text/html" id="vtech-tmpl-chatbot-quick">
		<?php vtech_render_chatbot_quick_row( '__INDEX__', array( 'label' => '', 'question' => '', 'action' => 'flow', 'intro' => '', 'options' => array() ) ); ?>
	</script>
	<script type="text/html" id="vtech-tmpl-chatbot-option">
		<?php vtech_render_chatbot_option_row( '__INDEX__', '__CINDEX__', array( 'label' => '', 'answer' => '', 'kind' => 'answer', 'link_label' => '', 'link_url' => '' ) ); ?>
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
	$item = wp_parse_args( is_array( $item ) ? $item : array(), array( 'label' => '', 'question' => '', 'action' => 'flow', 'intro' => '', 'options' => array() ) );
	?>
	<div class="vtech-row vtech-col-row" data-row>
		<span class="vtech-drag dashicons dashicons-menu"></span>
		<div class="vtech-row-main">
			<div class="vtech-grid-2">
			<?php
			VTech_Admin::text_field( "chatbot[quick_questions][$i][label]", $item['label'], 'Button label' );
			VTech_Admin::select_field( "chatbot[quick_questions][$i][action]", $item['action'], 'Button action', array( 'flow' => 'Show guided options', 'question' => 'Answer using FAQs', 'contact' => 'Open contact action' ) );
			?>
			</div>
			<?php VTech_Admin::text_field( "chatbot[quick_questions][$i][question]", $item['question'], 'Question to match in FAQs (for Answer using FAQs)' ); ?>
			<?php vtech_chatbot_textarea_field( "chatbot[quick_questions][$i][intro]", $item['intro'], 'Guided flow introduction', 2 ); ?>
			<div class="vtech-sub-block">
				<div class="vtech-sub-head">
					<span>Guided options</span>
					<button type="button" class="button-link vtech-add-sub" data-sub="chatbot-option" data-parent="<?php echo esc_attr( $i ); ?>">+ Add option</button>
				</div>
				<div class="vtech-sub-items" data-sub-items="<?php echo esc_attr( $i ); ?>">
					<?php
					if ( ! empty( $item['options'] ) && is_array( $item['options'] ) ) {
						foreach ( $item['options'] as $ci => $option ) {
							vtech_render_chatbot_option_row( $i, $ci, $option );
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
 * Render an editable guided-chat option row.
 *
 * @param int|string $i  Parent row index.
 * @param int|string $ci Option row index.
 * @param array      $option Option content.
 * @return void
 */
function vtech_render_chatbot_option_row( $i, $ci, $option ) {
	$option = wp_parse_args( is_array( $option ) ? $option : array(), array( 'label' => '', 'answer' => '', 'kind' => 'answer', 'link_label' => '', 'link_url' => '' ) );
	?>
	<div class="vtech-row vtech-subrow" data-subrow>
		<div class="vtech-row-main">
			<div class="vtech-grid-2">
				<?php
				VTech_Admin::text_field( "chatbot[quick_questions][$i][options][$ci][label]", $option['label'], 'Option button label' );
				VTech_Admin::select_field( "chatbot[quick_questions][$i][options][$ci][kind]", $option['kind'], 'Option type', array( 'answer' => 'Show answer and remaining options', 'other' => 'Other / Contact (always last)' ) );
				?>
			</div>
			<?php vtech_chatbot_textarea_field( "chatbot[quick_questions][$i][options][$ci][answer]", $option['answer'], 'Bot answer', 2 ); ?>
			<div class="vtech-grid-2">
				<?php
				VTech_Admin::text_field( "chatbot[quick_questions][$i][options][$ci][link_label]", $option['link_label'], 'Optional page link label' );
				VTech_Admin::text_field( "chatbot[quick_questions][$i][options][$ci][link_url]", $option['link_url'], 'Optional page URL' );
				?>
			</div>
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
