<?php
/**
 * Administrator settings and lead-management screens.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize a scalar admin text value without accepting nested request data.
 *
 * @param mixed $value Submitted value.
 * @param bool  $multiline Preserve line breaks.
 * @return string
 */
function tea_chat_admin_text( $value, $multiline = false ) {
	if ( ! is_scalar( $value ) ) {
		return '';
	}
	return $multiline ? sanitize_textarea_field( (string) $value ) : sanitize_text_field( (string) $value );
}

/**
 * Register plugin admin pages.
 *
 * @return void
 */
function tea_chat_register_admin_menu() {
	add_menu_page(
		__( 'Chat Assistant', 'techeasy-chat' ),
		__( 'Chat Assistant', 'techeasy-chat' ),
		'manage_options',
		'techeasy-chat',
		'tea_chat_render_settings_page',
		'dashicons-format-chat',
		58
	);
	add_submenu_page( 'techeasy-chat', __( 'Chat Assistant Settings', 'techeasy-chat' ), __( 'Settings', 'techeasy-chat' ), 'manage_options', 'techeasy-chat', 'tea_chat_render_settings_page' );
	add_submenu_page( 'techeasy-chat', __( 'Chat Leads', 'techeasy-chat' ), __( 'Leads', 'techeasy-chat' ), 'manage_options', 'techeasy-chat-leads', 'tea_chat_render_leads_page' );
}

/**
 * Enqueue assets only on this plugin's admin screens.
 *
 * @param string $hook Current admin hook.
 * @return void
 */
function tea_chat_admin_assets( $hook ) {
	if ( false === strpos( $hook, 'techeasy-chat' ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_style( 'techeasy-chat-admin', TEA_CHAT_URL . 'assets/admin.css', array(), TEA_CHAT_VERSION );
	wp_enqueue_script( 'techeasy-chat-admin', TEA_CHAT_URL . 'assets/admin.js', array(), TEA_CHAT_VERSION, true );
}

/**
 * Sanitize a related-question identifier list.
 *
 * @param mixed $value Submitted values.
 * @param array $allowed Allowed identifiers.
 * @return array
 */
function tea_chat_sanitize_related_ids( $value, $allowed ) {
	if ( ! is_array( $value ) ) {
		return array();
	}
	$ids = array();
	foreach ( $value as $id ) {
		if ( ! is_scalar( $id ) ) {
			continue;
		}
		$id = sanitize_key( $id );
		if ( in_array( $id, $allowed, true ) && ! in_array( $id, $ids, true ) ) {
			$ids[] = $id;
		}
	}
	return $ids;
}

/**
 * Make a unique safe identifier in a settings list.
 *
 * @param mixed  $value Submitted identifier.
 * @param string $fallback Fallback identifier.
 * @param array  $used Identifiers already used.
 * @return string
 */
function tea_chat_unique_id( $value, $fallback, &$used ) {
	$id = sanitize_key( is_scalar( $value ) ? (string) $value : '' );
	if ( '' === $id ) {
		$id = sanitize_key( $fallback );
	}
	$base = $id;
	$index = 2;
	while ( isset( $used[ $id ] ) ) {
		$id = $base . '-' . $index;
		++$index;
	}
	$used[ $id ] = true;
	return $id;
}

/**
 * Validate and save the settings form.
 *
 * @return void
 */
function tea_chat_save_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to manage chatbot settings.', 'techeasy-chat' ) );
	}
	check_admin_referer( 'tea_chat_save_settings', 'tea_chat_settings_nonce' );

	$raw = isset( $_POST['settings'] ) && is_array( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : array();
	$defaults = tea_chat_default_settings();
	$faqs_raw = isset( $raw['faqs'] ) && is_array( $raw['faqs'] ) ? $raw['faqs'] : array();
	$faqs        = array();
	$faq_related = array();
	$faq_used    = array();

	foreach ( $faqs_raw as $index => $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}
		$question = isset( $item['question'] ) ? tea_chat_admin_text( $item['question'] ) : '';
		$answer   = isset( $item['answer'] ) ? tea_chat_admin_text( $item['answer'], true ) : '';
		if ( '' === $question || '' === $answer ) {
			continue;
		}
		$id      = tea_chat_unique_id( isset( $item['id'] ) ? $item['id'] : '', 'question-' . absint( $index ), $faq_used );
		$faqs[] = array(
			'id'          => $id,
			'question'    => $question,
			'answer'      => $answer,
			'keywords'    => isset( $item['keywords'] ) ? tea_chat_admin_text( $item['keywords'] ) : '',
			'related_ids' => array(),
		);
		$faq_related[] = isset( $item['related_ids'] ) ? $item['related_ids'] : array();
	}
	$faq_ids = wp_list_pluck( $faqs, 'id' );
	foreach ( $faqs as $index => $faq ) {
		$faqs[ $index ]['related_ids'] = array_values(
			array_diff(
				tea_chat_sanitize_related_ids( $faq_related[ $index ], $faq_ids ),
				array( $faq['id'] )
			)
		);
	}

	$quick_raw  = isset( $raw['quick_questions'] ) && is_array( $raw['quick_questions'] ) ? $raw['quick_questions'] : array();
	$quick      = array();
	$quick_used = array();
	foreach ( $quick_raw as $index => $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}
		$label = isset( $item['label'] ) ? tea_chat_admin_text( $item['label'] ) : '';
		if ( '' === $label ) {
			continue;
		}
		$action = isset( $item['action'] ) && in_array( $item['action'], array( 'guided', 'answer', 'contact' ), true ) ? $item['action'] : 'guided';
		$answer_id_input = isset( $item['answer_id'] ) ? tea_chat_admin_text( $item['answer_id'] ) : '';
		$answer_id       = in_array( sanitize_key( $answer_id_input ), $faq_ids, true ) ? sanitize_key( $answer_id_input ) : '';
		if ( 'answer' === $action && '' === $answer_id ) {
			tea_chat_settings_error_redirect( 'missing-quick-answer' );
		}
		$row    = array(
			'id'        => tea_chat_unique_id( isset( $item['id'] ) ? $item['id'] : '', 'topic-' . absint( $index ), $quick_used ),
			'label'     => $label,
			'action'    => $action,
			'intro'     => isset( $item['intro'] ) ? tea_chat_admin_text( $item['intro'], true ) : '',
			'answer_id' => $answer_id,
			'options'   => array(),
		);
		if ( 'guided' === $action && isset( $item['options'] ) && is_array( $item['options'] ) ) {
			$option_used = array();
			$other       = null;
			foreach ( $item['options'] as $option_index => $option ) {
				if ( ! is_array( $option ) ) {
					continue;
				}
				$option_label = isset( $option['label'] ) ? tea_chat_admin_text( $option['label'] ) : '';
				$option_action = isset( $option['action'] ) && 'contact' === $option['action'] ? 'contact' : 'answer';
				if ( '' === $option_label ) {
					continue;
				}
				$option_row = array(
					'id'          => tea_chat_unique_id( isset( $option['id'] ) ? $option['id'] : '', 'option-' . absint( $option_index ), $option_used ),
					'label'       => $option_label,
					'action'      => $option_action,
					'answer'      => isset( $option['answer'] ) ? tea_chat_admin_text( $option['answer'], true ) : '',
					'related_ids' => tea_chat_sanitize_related_ids( isset( $option['related_ids'] ) ? $option['related_ids'] : array(), $faq_ids ),
				);
				if ( 'contact' === $option_action ) {
					if ( null === $other ) {
						$other = $option_row;
					}
				} elseif ( '' !== $option_row['answer'] ) {
					$row['options'][] = $option_row;
				}
			}
			if ( null === $other ) {
				$other = array(
					'id'          => tea_chat_unique_id( 'other', 'other', $option_used ),
					'label'       => 'Other',
					'action'      => 'contact',
					'answer'      => '',
					'related_ids' => array(),
				);
			}
			$row['options'][] = $other;
		}
		$quick[] = $row;
	}

	$lead_raw = isset( $raw['lead_questions'] ) && is_array( $raw['lead_questions'] ) ? $raw['lead_questions'] : array();
	$lead_questions = array();
	foreach ( array_keys( $defaults['lead_questions'] ) as $key ) {
		$value = isset( $lead_raw[ $key ] ) ? tea_chat_admin_text( $lead_raw[ $key ] ) : '';
		$lead_questions[ $key ] = '' !== $value ? $value : $defaults['lead_questions'][ $key ];
	}

	$actions_raw = isset( $raw['actions'] ) && is_array( $raw['actions'] ) ? $raw['actions'] : array();
	$actions = array();
	$action_used = array();
	foreach ( $actions_raw as $index => $action ) {
		if ( ! is_array( $action ) ) {
			continue;
		}
		$label = isset( $action['label'] ) ? tea_chat_admin_text( $action['label'] ) : '';
		$url   = tea_chat_sanitize_url( isset( $action['url'] ) ? $action['url'] : '' );
		if ( '' === $label || '' === $url ) {
			continue;
		}
		$icon = isset( $action['icon'] ) && in_array( $action['icon'], array( 'whatsapp', 'instagram', 'contact', 'custom' ), true ) ? $action['icon'] : 'custom';
		$actions[] = array(
			'id'       => tea_chat_unique_id( isset( $action['id'] ) ? $action['id'] : '', 'action-' . absint( $index ), $action_used ),
			'icon'     => $icon,
			'icon_url' => isset( $action['icon_url'] ) ? esc_url_raw( tea_chat_admin_text( $action['icon_url'] ), array( 'http', 'https' ) ) : '',
			'label'    => $label,
			'url'      => $url,
		);
	}

	$emails_raw   = isset( $raw['notification_emails'] ) ? tea_chat_admin_text( $raw['notification_emails'] ) : '';
	$email_values = array_values( array_filter( preg_split( '/[\s,;]+/', $emails_raw ), 'strlen' ) );
	$emails       = array_filter( array_map( 'sanitize_email', $email_values ), 'is_email' );
	if ( ! empty( $email_values ) && count( $emails ) !== count( $email_values ) ) {
		tea_chat_settings_error_redirect( 'invalid-emails' );
	}
	$webhook    = isset( $raw['webhook_url'] ) ? esc_url_raw( trim( tea_chat_admin_text( $raw['webhook_url'] ) ) ) : '';
	if ( '' !== $webhook && ( 'https' !== strtolower( (string) wp_parse_url( $webhook, PHP_URL_SCHEME ) ) || ! wp_http_validate_url( $webhook ) ) ) {
		tea_chat_settings_error_redirect( 'invalid-webhook' );
	}
	$domains_raw = isset( $raw['allowed_domains'] ) ? tea_chat_admin_text( $raw['allowed_domains'], true ) : '';
	$domains     = array();
	foreach ( preg_split( '/[\r\n,]+/', $domains_raw ) as $domain_input ) {
		$domain = tea_chat_normalize_origin( $domain_input );
		if ( '' !== trim( $domain_input ) && '' === $domain ) {
			tea_chat_settings_error_redirect( 'invalid-domains' );
		}
		if ( '' !== $domain && ! in_array( $domain, $domains, true ) ) {
			$domains[] = $domain;
		}
	}

	$settings = array(
		'welcome'       => isset( $raw['welcome'] ) ? tea_chat_admin_text( $raw['welcome'], true ) : $defaults['welcome'],
		'bot_name'      => isset( $raw['bot_name'] ) ? tea_chat_admin_text( $raw['bot_name'] ) : $defaults['bot_name'],
		'avatar'        => isset( $raw['avatar'] ) ? esc_url_raw( tea_chat_admin_text( $raw['avatar'] ), array( 'http', 'https' ) ) : '',
		'primary_color' => isset( $raw['primary_color'] ) ? sanitize_hex_color( tea_chat_admin_text( $raw['primary_color'] ) ) : $defaults['primary_color'],
		'position'      => isset( $raw['position'] ) && 'left' === $raw['position'] ? 'left' : 'right',
		'quick_questions' => $quick,
		'faqs'          => $faqs,
		'lead_questions' => $lead_questions,
		'fallback'      => isset( $raw['fallback'] ) ? tea_chat_admin_text( $raw['fallback'], true ) : $defaults['fallback'],
		'actions'       => $actions,
		'notification_emails' => implode( ',', $emails ),
		'webhook_url'   => $webhook,
		'allowed_domains' => $domains,
		'delete_data_on_uninstall' => empty( $raw['delete_data_on_uninstall'] ) ? 0 : 1,
	);
	if ( ! $settings['primary_color'] ) {
		$settings['primary_color'] = $defaults['primary_color'];
	}
	if ( '' === $settings['welcome'] ) {
		$settings['welcome'] = $defaults['welcome'];
	}
	if ( '' === $settings['bot_name'] ) {
		$settings['bot_name'] = $defaults['bot_name'];
	}
	if ( empty( $settings['notification_emails'] ) ) {
		$settings['notification_emails'] = get_option( 'admin_email' );
	}

	update_option( TEA_CHAT_OPTION, $settings, false );
	wp_safe_redirect( add_query_arg( array( 'page' => 'techeasy-chat', 'updated' => '1' ), admin_url( 'admin.php' ) ) );
	exit;
}

/**
 * Redirect back to settings with a validation error code.
 *
 * @param string $code Error code.
 * @return void
 */
function tea_chat_settings_error_redirect( $code ) {
	wp_safe_redirect(
		add_query_arg(
			array(
				'page'           => 'techeasy-chat',
				'settings_error' => sanitize_key( $code ),
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}

/**
 * Sanitize an action URL while allowing local paths.
 *
 * @param mixed $value Submitted URL.
 * @return string
 */
function tea_chat_sanitize_url( $value ) {
	$value = is_string( $value ) ? trim( $value ) : '';
	if ( '' === $value || 0 === strpos( $value, '//' ) ) {
		return '';
	}
	if ( '/' === substr( $value, 0, 1 ) || '#' === substr( $value, 0, 1 ) ) {
		return sanitize_text_field( $value );
	}
	return esc_url_raw( $value, array( 'http', 'https', 'mailto', 'tel' ) );
}

/**
 * Render the chatbot settings screen.
 *
 * @return void
 */
function tea_chat_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$settings = tea_chat_get_settings();
	$faqs     = isset( $settings['faqs'] ) && is_array( $settings['faqs'] ) ? $settings['faqs'] : array();
	?>
	<div class="wrap tea-chat-admin">
		<h1><?php esc_html_e( 'Tech Easy Chat Assistant', 'techeasy-chat' ); ?></h1>
		<?php if ( isset( $_GET['updated'] ) ) : ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Chat assistant settings saved.', 'techeasy-chat' ); ?></p></div>
		<?php endif; ?>
		<?php
		if ( isset( $_GET['settings_error'] ) ) {
			$error_code = sanitize_key( tea_chat_admin_text( wp_unslash( $_GET['settings_error'] ) ) );
			$error_text = array(
				'invalid-emails'  => 'One or more notification email addresses are invalid. No settings were saved.',
				'invalid-webhook' => 'The webhook URL must be a valid HTTPS URL. No settings were saved.',
				'invalid-domains' => 'Allowed frontend entries must be origins only (for example https://www.example.com), with no path. No settings were saved.',
				'missing-quick-answer' => 'A quick question set to Show answer must be linked to a Questions & Answers entry. No settings were saved.',
			);
			if ( isset( $error_text[ $error_code ] ) ) :
				?>
				<div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error_text[ $error_code ] ); ?></p></div>
				<?php
			endif;
		}
		?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="tea_chat_save_settings" />
			<?php wp_nonce_field( 'tea_chat_save_settings', 'tea_chat_settings_nonce' ); ?>

			<section class="tea-panel">
				<h2>1. Welcome</h2>
				<?php tea_chat_textarea( 'settings[welcome]', $settings['welcome'], 'Welcome message' ); ?>
				<div class="tea-grid">
					<?php
					tea_chat_text( 'settings[bot_name]', $settings['bot_name'], 'Bot name' );
					tea_chat_text( 'settings[avatar]', $settings['avatar'], 'Avatar image URL', 'https://example.com/avatar.png', 'tea-media-url' );
					?>
				</div>
				<div class="tea-grid">
					<label class="tea-field"><span>Primary color</span><input type="color" name="settings[primary_color]" value="<?php echo esc_attr( $settings['primary_color'] ); ?>" /></label>
					<label class="tea-field"><span>Widget position</span><select name="settings[position]"><option value="right" <?php selected( 'right', $settings['position'] ); ?>>Right</option><option value="left" <?php selected( 'left', $settings['position'] ); ?>>Left</option></select></label>
				</div>
			</section>

			<section class="tea-panel">
				<h2>2. Quick Questions</h2>
				<p>Main topic buttons can open a guided menu, show a saved Q&amp;A answer, or open the enquiry form. Contact options are moved to the end of each guided list.</p>
				<div class="tea-list" data-list="quick_questions">
					<?php foreach ( $settings['quick_questions'] as $index => $item ) : ?>
						<?php tea_chat_render_quick_row( $index, $item, $faqs ); ?>
					<?php endforeach; ?>
				</div>
				<button type="button" class="button tea-add" data-add="quick">Add Quick Question</button>
			</section>

			<section class="tea-panel">
				<h2>3. Questions &amp; Answers</h2>
				<div class="tea-list" data-list="faqs">
					<?php foreach ( $faqs as $index => $faq ) : ?>
						<?php tea_chat_render_faq_row( $index, $faq, $faqs ); ?>
					<?php endforeach; ?>
				</div>
				<button type="button" class="button tea-add" data-add="faq">Add Answer</button>
			</section>

			<section class="tea-panel">
				<h2>4. Lead Form Questions</h2>
				<div class="tea-grid">
					<?php foreach ( $settings['lead_questions'] as $key => $question ) : ?>
						<?php tea_chat_text( 'settings[lead_questions][' . esc_attr( $key ) . ']', $question, ucfirst( $key ) . ' prompt' ); ?>
					<?php endforeach; ?>
				</div>
			</section>

			<section class="tea-panel">
				<h2>5. Fallback Replies</h2>
				<?php tea_chat_textarea( 'settings[fallback]', $settings['fallback'], 'No answer found' ); ?>
			</section>

			<section class="tea-panel">
				<h2>6. After Enquiry Icons &amp; Links</h2>
				<div class="tea-list" data-list="actions">
					<?php foreach ( $settings['actions'] as $index => $action ) : ?>
						<?php tea_chat_render_action_row( $index, $action ); ?>
					<?php endforeach; ?>
				</div>
				<button type="button" class="button tea-add" data-add="action">Add Contact Icon</button>
			</section>

			<section class="tea-panel">
				<h2>7. Notification Settings</h2>
				<?php
				tea_chat_text( 'settings[notification_emails]', $settings['notification_emails'], 'Lead notification email(s)', 'sales@example.com, owner@example.com' );
				tea_chat_text( 'settings[webhook_url]', $settings['webhook_url'], 'Optional Google Sheet webhook URL (HTTPS only)' );
				tea_chat_textarea( 'settings[allowed_domains]', implode( "\n", $settings['allowed_domains'] ), 'Allowed React frontend origins (one origin per line)', 3, 'https://www.example.com' );
				?>
				<label class="tea-checkbox"><input type="checkbox" name="settings[delete_data_on_uninstall]" value="1" <?php checked( ! empty( $settings['delete_data_on_uninstall'] ) ); ?> /> Delete chatbot settings and leads when this plugin is uninstalled.</label>
			</section>

			<?php submit_button( __( 'Save Chat Assistant', 'techeasy-chat' ), 'primary', 'submit', true ); ?>
		</form>
	</div>

	<template id="tea-template-quick">
		<?php tea_chat_render_quick_row( '__INDEX__', array( 'id' => '', 'label' => '', 'action' => 'guided', 'intro' => '', 'answer_id' => '', 'options' => array() ), $faqs ); ?>
	</template>
	<template id="tea-template-option">
		<?php tea_chat_render_option_row( '__INDEX__', '__OPTION_INDEX__', array( 'id' => '', 'label' => '', 'action' => 'answer', 'answer' => '', 'related_ids' => array() ), $faqs ); ?>
	</template>
	<template id="tea-template-faq">
		<?php tea_chat_render_faq_row( '__INDEX__', array( 'id' => '', 'question' => '', 'answer' => '', 'keywords' => '', 'related_ids' => array() ), $faqs ); ?>
	</template>
	<template id="tea-template-action">
		<?php tea_chat_render_action_row( '__INDEX__', array( 'id' => '', 'icon' => 'custom', 'icon_url' => '', 'label' => '', 'url' => '' ) ); ?>
	</template>
	<?php
}

/**
 * Render a text input.
 *
 * @param string $name Input name.
 * @param string $value Input value.
 * @param string $label Label.
 * @param string $placeholder Placeholder.
 * @param string $class Optional class.
 * @return void
 */
function tea_chat_text( $name, $value, $label, $placeholder = '', $class = '' ) {
	?>
	<label class="tea-field">
		<span><?php echo esc_html( $label ); ?></span>
		<input class="<?php echo esc_attr( $class ); ?>" type="text" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" placeholder="<?php echo esc_attr( $placeholder ); ?>" />
		<?php if ( 'tea-media-url' === $class ) : ?><button type="button" class="button tea-media-pick">Choose image</button><?php endif; ?>
	</label>
	<?php
}

/**
 * Render a textarea.
 *
 * @param string $name Input name.
 * @param string $value Textarea value.
 * @param string $label Label.
 * @param int    $rows Row count.
 * @param string $placeholder Placeholder.
 * @return void
 */
function tea_chat_textarea( $name, $value, $label, $rows = 3, $placeholder = '' ) {
	?>
	<label class="tea-field">
		<span><?php echo esc_html( $label ); ?></span>
		<textarea name="<?php echo esc_attr( $name ); ?>" rows="<?php echo absint( $rows ); ?>" placeholder="<?php echo esc_attr( $placeholder ); ?>"><?php echo esc_textarea( $value ); ?></textarea>
	</label>
	<?php
}

/**
 * Render an action select.
 *
 * @param string $name Input name.
 * @param string $value Current value.
 * @param array  $options Select options.
 * @param string $label Label.
 * @return void
 */
function tea_chat_select( $name, $value, $options, $label ) {
	?>
	<label class="tea-field">
		<span><?php echo esc_html( $label ); ?></span>
		<select name="<?php echo esc_attr( $name ); ?>">
			<?php foreach ( $options as $option_value => $option_label ) : ?>
				<option value="<?php echo esc_attr( $option_value ); ?>" <?php selected( (string) $value, (string) $option_value ); ?>><?php echo esc_html( $option_label ); ?></option>
			<?php endforeach; ?>
		</select>
	</label>
	<?php
}

/**
 * Render related FAQ checkboxes.
 *
 * @param string $name Input name.
 * @param array  $selected Selected Q&A ids.
 * @param array  $faqs Available FAQs.
 * @return void
 */
function tea_chat_related_checkboxes( $name, $selected, $faqs ) {
	?>
	<fieldset class="tea-related">
		<legend>Related-question buttons</legend>
		<?php foreach ( $faqs as $faq ) : ?>
			<label><input type="checkbox" name="<?php echo esc_attr( $name ); ?>[]" value="<?php echo esc_attr( $faq['id'] ); ?>" <?php checked( in_array( $faq['id'], (array) $selected, true ) ); ?> /> <?php echo esc_html( $faq['question'] ); ?></label>
		<?php endforeach; ?>
	</fieldset>
	<?php
}

/**
 * Render a quick-question group.
 *
 * @param int|string $index Row index.
 * @param array      $item Row data.
 * @param array      $faqs FAQ list.
 * @return void
 */
function tea_chat_render_quick_row( $index, $item, $faqs ) {
	$item = wp_parse_args( is_array( $item ) ? $item : array(), array( 'id' => '', 'label' => '', 'action' => 'guided', 'intro' => '', 'answer_id' => '', 'options' => array() ) );
	?>
	<div class="tea-item tea-quick" draggable="true" data-row>
		<div class="tea-row-head"><span class="tea-drag" aria-label="Drag to reorder">↕</span><strong>Quick question</strong><button type="button" class="tea-remove button-link-delete">Remove</button></div>
		<input type="hidden" name="settings[quick_questions][<?php echo esc_attr( $index ); ?>][id]" value="<?php echo esc_attr( $item['id'] ); ?>" />
		<div class="tea-grid">
			<?php
			tea_chat_text( 'settings[quick_questions][' . $index . '][label]', $item['label'], 'Button label' );
			tea_chat_select( 'settings[quick_questions][' . $index . '][action]', $item['action'], array( 'guided' => 'Show guided options', 'answer' => 'Show answer', 'contact' => 'Open contact form' ), 'Button action' );
			?>
		</div>
		<div class="tea-guided-fields" data-action-fields="guided">
			<?php tea_chat_textarea( 'settings[quick_questions][' . $index . '][intro]', $item['intro'], 'Guided intro message', 2 ); ?>
			<div class="tea-options">
				<?php
				if ( ! empty( $item['options'] ) && is_array( $item['options'] ) ) {
					foreach ( $item['options'] as $option_index => $option ) {
						tea_chat_render_option_row( $index, $option_index, $option, $faqs );
					}
				}
				?>
			</div>
			<button type="button" class="button tea-add-option" data-parent="<?php echo esc_attr( $index ); ?>">Add Option</button>
		</div>
		<div data-action-fields="answer">
			<?php tea_chat_answer_select( 'settings[quick_questions][' . $index . '][answer_id]', $item['answer_id'], $faqs, 'Answer entry' ); ?>
		</div>
	</div>
	<?php
}

/**
 * Render one nested guided option.
 *
 * @param int|string $index Parent index.
 * @param int|string $option_index Option index.
 * @param array      $option Option row.
 * @param array      $faqs Available FAQs.
 * @return void
 */
function tea_chat_render_option_row( $index, $option_index, $option, $faqs = array() ) {
	$option = wp_parse_args( is_array( $option ) ? $option : array(), array( 'id' => '', 'label' => '', 'action' => 'answer', 'answer' => '', 'related_ids' => array() ) );
	$base   = 'settings[quick_questions][' . $index . '][options][' . $option_index . ']';
	?>
	<div class="tea-option" draggable="true" data-option-row>
		<div class="tea-row-head"><strong>Guided option</strong><button type="button" class="tea-remove button-link-delete">Remove option</button></div>
		<input type="hidden" name="<?php echo esc_attr( $base . '[id]' ); ?>" value="<?php echo esc_attr( $option['id'] ); ?>" />
		<div class="tea-grid">
			<?php
			tea_chat_text( $base . '[label]', $option['label'], 'Option label' );
			tea_chat_select( $base . '[action]', $option['action'], array( 'answer' => 'Show answer and remaining options', 'contact' => 'Open contact form' ), 'Option action' );
			?>
		</div>
		<div data-option-answer <?php echo 'contact' === $option['action'] ? 'hidden' : ''; ?>>
			<?php tea_chat_textarea( $base . '[answer]', $option['answer'], 'Answer', 2 ); ?>
			<?php tea_chat_related_checkboxes( $base . '[related_ids]', $option['related_ids'], $faqs ); ?>
		</div>
	</div>
	<?php
}

/**
 * Render an answer selector for a quick question.
 *
 * @param string $name Input name.
 * @param string $selected Selected FAQ id.
 * @param array  $faqs FAQ list.
 * @param string $label Field label.
 * @return void
 */
function tea_chat_answer_select( $name, $selected, $faqs, $label ) {
	$options = array( '' => 'Select an answer' );
	foreach ( $faqs as $faq ) {
		$options[ $faq['id'] ] = $faq['question'];
	}
	tea_chat_select( $name, $selected, $options, $label );
}

/**
 * Render a Q&A row.
 *
 * @param int|string $index Row index.
 * @param array      $faq FAQ data.
 * @param array      $faqs Available FAQ list.
 * @return void
 */
function tea_chat_render_faq_row( $index, $faq, $faqs ) {
	$faq = wp_parse_args( is_array( $faq ) ? $faq : array(), array( 'id' => '', 'question' => '', 'answer' => '', 'keywords' => '', 'related_ids' => array() ) );
	?>
	<div class="tea-item" draggable="true" data-row>
		<div class="tea-row-head"><span class="tea-drag" aria-label="Drag to reorder">↕</span><strong>Question &amp; Answer</strong><button type="button" class="tea-remove button-link-delete">Remove</button></div>
		<input type="hidden" name="settings[faqs][<?php echo esc_attr( $index ); ?>][id]" value="<?php echo esc_attr( $faq['id'] ); ?>" />
		<?php
		tea_chat_text( 'settings[faqs][' . $index . '][question]', $faq['question'], 'Question' );
		tea_chat_textarea( 'settings[faqs][' . $index . '][answer]', $faq['answer'], 'Answer', 3 );
		tea_chat_text( 'settings[faqs][' . $index . '][keywords]', $faq['keywords'], 'Matching keywords (comma separated)' );
		tea_chat_related_checkboxes( 'settings[faqs][' . $index . '][related_ids]', $faq['related_ids'], $faqs );
		?>
	</div>
	<?php
}

/**
 * Render an after-enquiry link row.
 *
 * @param int|string $index Row index.
 * @param array      $action Action data.
 * @return void
 */
function tea_chat_render_action_row( $index, $action ) {
	$action = wp_parse_args( is_array( $action ) ? $action : array(), array( 'id' => '', 'icon' => 'custom', 'icon_url' => '', 'label' => '', 'url' => '' ) );
	?>
	<div class="tea-item tea-action" draggable="true" data-row>
		<div class="tea-row-head"><span class="tea-drag" aria-label="Drag to reorder">↕</span><strong>Contact icon/link</strong><button type="button" class="tea-remove button-link-delete">Remove</button></div>
		<input type="hidden" name="settings[actions][<?php echo esc_attr( $index ); ?>][id]" value="<?php echo esc_attr( $action['id'] ); ?>" />
		<div class="tea-grid">
			<?php
			tea_chat_select( 'settings[actions][' . $index . '][icon]', $action['icon'], array( 'whatsapp' => 'WhatsApp', 'instagram' => 'Instagram', 'contact' => 'Contact', 'custom' => 'Custom upload' ), 'Icon' );
			tea_chat_text( 'settings[actions][' . $index . '][label]', $action['label'], 'Label' );
			tea_chat_text( 'settings[actions][' . $index . '][icon_url]', $action['icon_url'], 'Custom icon image URL', '', 'tea-media-url' );
			tea_chat_text( 'settings[actions][' . $index . '][url]', $action['url'], 'Destination URL' );
			?>
		</div>
	</div>
	<?php
}

/**
 * Build safe lead query filters from GET parameters.
 *
 * @return array
 */
function tea_chat_lead_filters() {
	$service = isset( $_GET['service'] ) ? tea_chat_admin_text( wp_unslash( $_GET['service'] ) ) : '';
	$from    = isset( $_GET['date_from'] ) ? tea_chat_admin_text( wp_unslash( $_GET['date_from'] ) ) : '';
	$to      = isset( $_GET['date_to'] ) ? tea_chat_admin_text( wp_unslash( $_GET['date_to'] ) ) : '';
	$search  = isset( $_GET['s'] ) ? tea_chat_admin_text( wp_unslash( $_GET['s'] ) ) : '';
	return array(
		'service' => $service,
		'date_from' => preg_match( '/^\d{4}-\d{2}-\d{2}$/', $from ) ? $from : '',
		'date_to' => preg_match( '/^\d{4}-\d{2}-\d{2}$/', $to ) ? $to : '',
		'search' => $search,
	);
}

/**
 * Query leads with optional search and filters.
 *
 * @param array $filters Filter values.
 * @return array
 */
function tea_chat_query_leads( $filters, $limit = 500 ) {
	global $wpdb;
	$table = $wpdb->prefix . TEA_CHAT_TABLE;
	$where = array( '1=1' );
	$args  = array();
	if ( '' !== $filters['service'] ) {
		$where[] = 'service = %s';
		$args[]  = $filters['service'];
	}
	if ( '' !== $filters['date_from'] ) {
		$where[] = 'created_at >= %s';
		$args[]  = $filters['date_from'] . ' 00:00:00';
	}
	if ( '' !== $filters['date_to'] ) {
		$where[] = 'created_at <= %s';
		$args[]  = $filters['date_to'] . ' 23:59:59';
	}
	if ( '' !== $filters['search'] ) {
		$like = '%' . $wpdb->esc_like( $filters['search'] ) . '%';
		$where[] = '(name LIKE %s OR email LIKE %s OR mobile LIKE %s OR service LIKE %s)';
		array_push( $args, $like, $like, $like, $like );
	}
	$sql = 'SELECT * FROM `' . esc_sql( $table ) . '` WHERE ' . implode( ' AND ', $where ) . ' ORDER BY created_at DESC';
	if ( null !== $limit ) {
		$sql .= ' LIMIT ' . absint( $limit );
	}
	if ( ! empty( $args ) ) {
		$sql = $wpdb->prepare( $sql, $args ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	}
	return $wpdb->get_results( $sql, ARRAY_A );
}

/**
 * Display the lead management screen.
 *
 * @return void
 */
function tea_chat_render_leads_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$filters  = tea_chat_lead_filters();
	$leads    = tea_chat_query_leads( $filters );
	$settings = tea_chat_get_settings();
	$services = array();
	foreach ( $settings['quick_questions'] as $question ) {
		if ( ! empty( $question['label'] ) ) {
			$services[] = $question['label'];
		}
	}
	$export_url = wp_nonce_url( add_query_arg( array_merge( array( 'action' => 'tea_chat_export_leads' ), $filters ), admin_url( 'admin-post.php' ) ), 'tea_chat_export_leads' );
	?>
	<div class="wrap tea-chat-admin">
		<h1>Chat Assistant Leads</h1>
		<form method="get" class="tea-filters">
			<input type="hidden" name="page" value="techeasy-chat-leads" />
			<input type="search" name="s" value="<?php echo esc_attr( $filters['search'] ); ?>" placeholder="Search name, email or mobile" />
			<select name="service"><option value="">All services</option><?php foreach ( $services as $service ) : ?><option value="<?php echo esc_attr( $service ); ?>" <?php selected( $filters['service'], $service ); ?>><?php echo esc_html( $service ); ?></option><?php endforeach; ?></select>
			<label>From <input type="date" name="date_from" value="<?php echo esc_attr( $filters['date_from'] ); ?>" /></label>
			<label>To <input type="date" name="date_to" value="<?php echo esc_attr( $filters['date_to'] ); ?>" /></label>
			<button class="button">Filter</button>
			<a class="button button-primary" href="<?php echo esc_url( $export_url ); ?>">Export CSV</a>
		</form>
		<table class="widefat striped">
			<thead><tr><th>Date</th><th>Name / Email</th><th>Mobile</th><th>Service</th><th>Interest</th><th>Message / Chat path</th><th>Status</th><th>Actions</th></tr></thead>
			<tbody>
			<?php if ( empty( $leads ) ) : ?>
				<tr><td colspan="8">No leads found.</td></tr>
			<?php else : foreach ( $leads as $lead ) : ?>
				<tr>
					<td><?php echo esc_html( get_date_from_gmt( $lead['created_at'], 'Y-m-d H:i' ) ); ?></td>
					<td><strong><?php echo esc_html( $lead['name'] ); ?></strong><br /><a href="mailto:<?php echo esc_attr( $lead['email'] ); ?>"><?php echo esc_html( $lead['email'] ); ?></a></td>
					<td><?php echo esc_html( $lead['mobile'] ); ?></td>
					<td><?php echo esc_html( $lead['service'] ); ?></td>
					<td><?php echo esc_html( $lead['interest'] ); ?></td>
					<td><?php echo esc_html( $lead['message'] ); ?><?php if ( ! empty( $lead['chat_path'] ) ) : ?><details><summary>Chat path</summary><code><?php echo esc_html( $lead['chat_path'] ); ?></code></details><?php endif; ?></td>
					<td>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
							<input type="hidden" name="action" value="tea_chat_lead_action" /><input type="hidden" name="operation" value="status" /><input type="hidden" name="lead_id" value="<?php echo absint( $lead['id'] ); ?>" />
							<?php wp_nonce_field( 'tea_chat_lead_' . absint( $lead['id'] ) ); ?>
							<select name="status" aria-label="Lead status"><option value="new" <?php selected( 'new', $lead['status'] ); ?>>New</option><option value="contacted" <?php selected( 'contacted', $lead['status'] ); ?>>Contacted</option><option value="closed" <?php selected( 'closed', $lead['status'] ); ?>>Closed</option></select>
							<button class="button button-small">Save</button>
						</form>
					</td>
					<td>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return window.confirm('Delete this lead?');">
							<input type="hidden" name="action" value="tea_chat_lead_action" /><input type="hidden" name="operation" value="delete" /><input type="hidden" name="lead_id" value="<?php echo absint( $lead['id'] ); ?>" />
							<?php wp_nonce_field( 'tea_chat_lead_' . absint( $lead['id'] ) ); ?>
							<button class="button-link-delete">Delete</button>
						</form>
					</td>
				</tr>
			<?php endforeach; endif; ?>
			</tbody>
		</table>
	</div>
	<?php
}

/**
 * Update or delete a lead after capability and nonce checks.
 *
 * @return void
 */
function tea_chat_handle_lead_action() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to manage leads.', 'techeasy-chat' ) );
	}
	$lead_id = isset( $_POST['lead_id'] ) && is_scalar( $_POST['lead_id'] ) ? absint( $_POST['lead_id'] ) : 0;
	check_admin_referer( 'tea_chat_lead_' . $lead_id );
	$operation = isset( $_POST['operation'] ) ? sanitize_key( tea_chat_admin_text( wp_unslash( $_POST['operation'] ) ) ) : '';
	global $wpdb;
	$table = $wpdb->prefix . TEA_CHAT_TABLE;
	if ( 'delete' === $operation ) {
		$wpdb->delete( $table, array( 'id' => $lead_id ), array( '%d' ) );
	} elseif ( 'status' === $operation ) {
		$status = isset( $_POST['status'] ) ? sanitize_key( tea_chat_admin_text( wp_unslash( $_POST['status'] ) ) ) : '';
		if ( in_array( $status, array( 'new', 'contacted', 'closed' ), true ) ) {
			$wpdb->update( $table, array( 'status' => $status ), array( 'id' => $lead_id ), array( '%s' ), array( '%d' ) );
		}
	}
	wp_safe_redirect( admin_url( 'admin.php?page=techeasy-chat-leads' ) );
	exit;
}

/**
 * Export filtered leads as CSV.
 *
 * @return void
 */
function tea_chat_export_leads() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to export leads.', 'techeasy-chat' ) );
	}
	check_admin_referer( 'tea_chat_export_leads' );
	$leads = tea_chat_query_leads( tea_chat_lead_filters(), null );
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=techeasy-chat-leads.csv' );
	$output = fopen( 'php://output', 'w' );
	fputcsv( $output, array( 'ID', 'Created At (UTC)', 'Name', 'Email', 'Mobile', 'Service', 'Interest', 'Message', 'Chat Path', 'Status' ) );
	foreach ( $leads as $lead ) {
		fputcsv(
			$output,
			array(
				$lead['id'],
				tea_chat_csv_value( $lead['created_at'] ),
				tea_chat_csv_value( $lead['name'] ),
				tea_chat_csv_value( $lead['email'] ),
				tea_chat_csv_value( $lead['mobile'] ),
				tea_chat_csv_value( $lead['service'] ),
				tea_chat_csv_value( $lead['interest'] ),
				tea_chat_csv_value( $lead['message'] ),
				tea_chat_csv_value( $lead['chat_path'] ),
				tea_chat_csv_value( $lead['status'] ),
			)
		);
	}
	fclose( $output );
	exit;
}

/**
 * Prevent spreadsheet formulas when opening exported user-provided values.
 *
 * @param string $value Cell value.
 * @return string
 */
function tea_chat_csv_value( $value ) {
	$value = (string) $value;
	return preg_match( '/^[\s]*[=+\-@]/', $value ) ? "'" . $value : $value;
}

