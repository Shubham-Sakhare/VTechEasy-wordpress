<?php
/**
 * Schema-driven field rendering + sanitizing.
 *
 * A "schema" is an ordered map of field-key => field-definition. Supported
 * field types:
 *
 *   text      single line         -> sanitize_text_field
 *   textarea  multi line          -> sanitize_textarea_field
 *   number    numeric             -> intval / floatval
 *   url       link/anchor/path    -> vtech_sanitize_link
 *   email     email               -> sanitize_email
 *   image     media URL           -> esc_url_raw
 *   icon      Feather icon name    -> sanitize_text_field (from picker list)
 *   color     hex/gradient token  -> sanitize_text_field
 *   toggle    on/off              -> bool (stored as 1/0)
 *   select    one of 'options'    -> whitelisted against options keys
 *   group     nested schema       -> recurse (fields)
 *   repeater  list of groups      -> recurse per row (fields)
 *
 * Every section's admin form, its save sanitizer and its REST shape all come
 * from the same schema, so changes are made in exactly one place.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class VTech_Schema {

	/* ---------------------------------------------------------------------
	 * Rendering
	 * ------------------------------------------------------------------- */

	/**
	 * Render a full schema into form fields.
	 *
	 * @param array  $schema      key => field definition.
	 * @param string $name_prefix e.g. "sections[home_hero]".
	 * @param array  $values      current values for this schema level.
	 */
	public static function render( array $schema, $name_prefix, $values ) {
		$values = is_array( $values ) ? $values : array();
		foreach ( $schema as $key => $field ) {
			$name  = $name_prefix . '[' . $key . ']';
			$value = isset( $values[ $key ] ) ? $values[ $key ] : self::field_default( $field );
			self::render_field( $field, $name, $value, $key );
		}
	}

	/**
	 * Render one field (dispatch on type).
	 *
	 * @param array  $field field definition.
	 * @param string $name  input name.
	 * @param mixed  $value current value.
	 * @param string $key   schema key (used for repeater template ids).
	 */
	public static function render_field( array $field, $name, $value, $key = '' ) {
		$type  = isset( $field['type'] ) ? $field['type'] : 'text';
		$label = isset( $field['label'] ) ? $field['label'] : ucfirst( str_replace( '_', ' ', $key ) );
		$ph    = isset( $field['placeholder'] ) ? $field['placeholder'] : '';

		switch ( $type ) {
			case 'textarea':
				printf(
					'<label class="vtech-field vtech-field-full"><span class="vtech-label">%1$s</span><textarea name="%2$s" rows="3" placeholder="%3$s" class="vtech-input">%4$s</textarea></label>',
					esc_html( $label ),
					esc_attr( $name ),
					esc_attr( $ph ),
					esc_textarea( (string) $value )
				);
				break;

			case 'editor':
				// Inside a repeater's JS row template the field name still holds
				// the __INDEX__ token. Such a textarea must NOT be turned into a
				// live TinyMCE editor (it would render an orphaned editor box
				// outside the rows). We mark it with `vtech-wp-editor-tmpl` so
				// the admin JS only upgrades it to a real editor once the row is
				// cloned with a real index.
				$is_template = ( false !== strpos( (string) $name, '__INDEX__' ) );
				$editor_cls  = $is_template ? 'vtech-wp-editor-tmpl' : 'vtech-wp-editor';
				$editor_id   = $is_template ? '' : 'vtech-editor-' . preg_replace( '/[^a-zA-Z0-9_-]/', '-', $name );
				echo '<div class="vtech-field vtech-field-full vtech-rich-editor"><span class="vtech-label">' . esc_html( $label ) . '</span>';
				echo '<textarea' . ( $editor_id ? ' id="' . esc_attr( $editor_id ) . '"' : '' ) . ' name="' . esc_attr( $name ) . '" class="vtech-input ' . esc_attr( $editor_cls ) . '" rows="14">' . esc_textarea( (string) $value ) . '</textarea>';
				echo '</div>';
				break;

			case 'number':
				printf(
					'<label class="vtech-field"><span class="vtech-label">%1$s</span><input type="number" name="%2$s" value="%3$s" placeholder="%4$s" class="vtech-input" /></label>',
					esc_html( $label ),
					esc_attr( $name ),
					esc_attr( (string) $value ),
					esc_attr( $ph )
				);
				break;

			case 'image':
				VTech_Admin::media_field( $name, (string) $value, $label );
				break;

			case 'icon':
				VTech_Admin::icon_field( $name, (string) $value, $label );
				break;

			case 'toggle':
				$checked = ! empty( $value ) ? ' checked' : '';
				printf(
					'<label class="vtech-field vtech-toggle"><span class="vtech-label">%1$s</span>'
					. '<span class="vtech-switch"><input type="hidden" name="%2$s" value="0" />'
					. '<input type="checkbox" name="%2$s" value="1"%3$s /><span class="vtech-slider"></span></span></label>',
					esc_html( $label ),
					esc_attr( $name ),
					$checked // phpcs:ignore -- static string.
				);
				break;

			case 'select':
				$options = isset( $field['options'] ) ? (array) $field['options'] : array();
				$out      = '<label class="vtech-field"><span class="vtech-label">' . esc_html( $label ) . '</span>';
				$out     .= '<select name="' . esc_attr( $name ) . '" class="vtech-input">';
				foreach ( $options as $ov => $ol ) {
					$out .= '<option value="' . esc_attr( $ov ) . '"' . selected( (string) $value, (string) $ov, false ) . '>' . esc_html( $ol ) . '</option>';
				}
				$out .= '</select></label>';
				echo $out; // phpcs:ignore WordPress.Security.EscapeOutput -- built with esc_* above.
				break;

			case 'multi_select':
				$options = isset( $field['options'] ) ? (array) $field['options'] : array();
				$selected_values = is_array( $value ) ? array_map( 'strval', $value ) : array();
				$out      = '<fieldset class="vtech-field vtech-multi-select"><legend class="vtech-label">' . esc_html( $label ) . '</legend>';
				foreach ( $options as $option_value => $option_label ) {
					$out .= '<label class="vtech-multi-select-option"><input type="checkbox" name="' . esc_attr( $name ) . '[]" value="' . esc_attr( $option_value ) . '"' . checked( in_array( (string) $option_value, $selected_values, true ), true, false ) . ' /> <span>' . esc_html( $option_label ) . '</span></label>';
				}
				$out .= '</fieldset>';
				echo $out; // phpcs:ignore WordPress.Security.EscapeOutput -- built with esc_* above.
				break;

			case 'group':
				$sub = isset( $field['fields'] ) ? $field['fields'] : array();
				if ( ! array_key_exists( 'collapsible', $field ) || ! empty( $field['collapsible'] ) ) {
					$panel_id = 'vtech-group-' . md5( $name );
					echo '<div class="vtech-group vtech-group-collapsible is-collapsed">';
					echo '<button type="button" class="vtech-group-toggle" aria-expanded="false" aria-controls="' . esc_attr( $panel_id ) . '">';
					echo '<span class="vtech-group-title">' . esc_html( $label ) . '</span><span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>';
					echo '</button><div class="vtech-group-body" id="' . esc_attr( $panel_id ) . '" hidden><div class="vtech-grid-2">';
					self::render( $sub, $name, is_array( $value ) ? $value : array() );
					echo '</div></div></div>';
					break;
				}
				echo '<div class="vtech-group"><div class="vtech-group-title">' . esc_html( $label ) . '</div><div class="vtech-grid-2">';
				self::render( $sub, $name, is_array( $value ) ? $value : array() );
				echo '</div></div>';
				break;

			case 'repeater':
				self::render_repeater( $field, $name, $value, $key );
				break;

			case 'url':
			case 'email':
			case 'color':
			case 'text':
			default:
				printf(
					'<label class="vtech-field"><span class="vtech-label">%1$s</span><input type="text" name="%2$s" value="%3$s" placeholder="%4$s" class="vtech-input" /></label>',
					esc_html( $label ),
					esc_attr( $name ),
					esc_attr( (string) $value ),
					esc_attr( $ph )
				);
				break;
		}
	}

	/**
	 * Render a repeater field + its JS row template.
	 *
	 * @param array  $field repeater definition (expects 'fields', 'label', 'item_label').
	 * @param string $name  base name e.g. sections[about_hero][points].
	 * @param mixed  $value current list value.
	 * @param string $key   schema key (unique template id).
	 */
	public static function render_repeater( array $field, $name, $value, $key ) {
		$sub        = isset( $field['fields'] ) ? $field['fields'] : array();
		$label      = isset( $field['label'] ) ? $field['label'] : ucfirst( $key );
		$item_label = isset( $field['item_label'] ) ? $field['item_label'] : 'Item';
		$collapsible = ! empty( $field['collapsible'] );
		$collapsible_panel = ! array_key_exists( 'collapsible_panel', $field ) || ! empty( $field['collapsible_panel'] );
		$rows       = is_array( $value ) ? $value : array();
		$tmpl_id    = 'rep-' . md5( $name );

		echo '<div class="vtech-panel vtech-sub-panel' . ( $collapsible_panel ? ' vtech-repeater-panel is-collapsed' : '' ) . '">';
		if ( $collapsible_panel ) {
			$panel_id = 'vtech-repeater-' . md5( $name );
			echo '<button type="button" class="vtech-repeater-toggle" aria-expanded="false" aria-controls="' . esc_attr( $panel_id ) . '">';
			echo '<span class="vtech-panel-title">' . esc_html( $label ) . '</span><span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>';
			echo '</button><div class="vtech-repeater-panel-body" id="' . esc_attr( $panel_id ) . '" hidden>';
		} else {
			echo '<h3 class="vtech-panel-title">' . esc_html( $label ) . '</h3>';
		}
		$scroll_cls = count( $rows ) > 9 ? ' vtech-scroll' : '';
		echo '<div class="vtech-repeater" data-repeater="' . esc_attr( $tmpl_id ) . '" data-base="' . esc_attr( $name ) . '">';
		echo '<div class="vtech-repeater-items' . esc_attr( $scroll_cls ) . '">';
		foreach ( $rows as $i => $row ) {
			self::render_repeater_row( $sub, $name, $i, $row, $field );
		}
		echo '</div>';
		echo '<button type="button" class="button button-primary vtech-add" data-target="' . esc_attr( $tmpl_id ) . '">+ Add ' . esc_html( $item_label ) . '</button>';
		echo '</div></div>';
		if ( $collapsible_panel ) {
			echo '</div>';
		}

		// Row template for JS cloning (index token __INDEX__). A <template>
		// element is used (not an inline <script>) so the browser never
		// renders its contents — this guarantees the hidden row's fields,
		// including any rich-text editor textarea, cannot leak onto the page
		// as an orphaned field outside the repeater.
		echo '<template id="vtech-tmpl-' . esc_attr( $tmpl_id ) . '">';
		self::render_repeater_row( $sub, $name, '__INDEX__', array(), $field );
		echo '</template>';
	}

	/**
	 * One repeater row.
	 *
	 * @param array  $sub  the per-row schema.
	 * @param string $base base name (list name).
	 * @param mixed  $i    index or token.
	 * @param array  $row  row values.
	 */
	public static function render_repeater_row( array $sub, $base, $i, $row, $field = array() ) {
		$feature_cls = ! empty( $row['feature'] ) ? ' is-feature' : '';
		$row_data = is_array( $row ) ? $row : array();

		if ( ! empty( $field['collapsible'] ) ) {
			$title_field = isset( $field['title_field'] ) ? $field['title_field'] : '';
			$title       = $title_field && ! empty( $row_data[ $title_field ] )
				? $row_data[ $title_field ]
				: 'Untitled ' . ( isset( $field['item_label'] ) ? $field['item_label'] : 'Item' );
			$body_id     = 'vtech-row-body-' . md5( $base . '[' . $i . ']' );
			echo '<div class="vtech-row vtech-row-collapsible is-collapsed' . esc_attr( $feature_cls ) . '" data-row data-title-field="' . esc_attr( $title_field ) . '" data-title-fallback="' . esc_attr( 'Untitled ' . ( isset( $field['item_label'] ) ? $field['item_label'] : 'Item' ) ) . '">';
			echo '<div class="vtech-row-head">';
			echo '<span class="vtech-drag dashicons dashicons-menu" aria-hidden="true"></span>';
			echo '<button type="button" class="vtech-row-toggle" aria-expanded="false" aria-controls="' . esc_attr( $body_id ) . '">';
			echo '<span class="vtech-row-title">' . esc_html( $title ) . '</span>';
			echo '<span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>';
			echo '</button>';
			echo '<button type="button" class="vtech-remove dashicons dashicons-trash" title="Delete this row" data-vtech-confirm="Delete this row? This cannot be undone."></button>';
			echo '</div>';
			echo '<div class="vtech-row-body" id="' . esc_attr( $body_id ) . '" hidden>';
			echo '<div class="vtech-row-main vtech-grid-2">';
			self::render( $sub, $base . '[' . $i . ']', $row_data );
			echo '</div></div></div>';
			return;
		}

		echo '<div class="vtech-row' . esc_attr( $feature_cls ) . '" data-row>';
		echo '<span class="vtech-drag dashicons dashicons-menu"></span>';
		echo '<div class="vtech-row-main vtech-grid-2">';
		self::render( $sub, $base . '[' . $i . ']', $row_data );
		echo '</div>';
		echo '<button type="button" class="vtech-remove dashicons dashicons-trash" title="Delete this row" data-vtech-confirm="Delete this row? This cannot be undone."></button>';
		echo '</div>';
	}

	/* ---------------------------------------------------------------------
	 * Sanitizing
	 * ------------------------------------------------------------------- */

	/**
	 * Sanitize a raw ($_POST) array against a schema. Everything not in the
	 * schema is dropped (whitelist), making the save path safe by design.
	 *
	 * @param array $schema key => field definition.
	 * @param array $raw    unslashed raw input for this level.
	 * @return array
	 */
	public static function sanitize( array $schema, $raw ) {
		$raw   = is_array( $raw ) ? $raw : array();
		$clean = array();

		foreach ( $schema as $key => $field ) {
			$type = isset( $field['type'] ) ? $field['type'] : 'text';
			$in   = isset( $raw[ $key ] ) ? $raw[ $key ] : null;

			switch ( $type ) {
				case 'textarea':
					$clean[ $key ] = sanitize_textarea_field( (string) $in );
					break;

				case 'editor':
					$clean[ $key ] = wp_kses_post( (string) $in );
					break;

				case 'number':
					$clean[ $key ] = is_numeric( $in ) ? $in + 0 : 0;
					break;

				case 'image':
					$clean[ $key ] = esc_url_raw( (string) $in );
					break;

				case 'email':
					$clean[ $key ] = sanitize_email( (string) $in );
					break;

				case 'url':
					$clean[ $key ] = vtech_sanitize_link( (string) $in );
					break;

				case 'toggle':
					$clean[ $key ] = ! empty( $in ) ? 1 : 0;
					break;

				case 'select':
					$options       = isset( $field['options'] ) ? array_map( 'strval', array_keys( (array) $field['options'] ) ) : array();
					$val           = sanitize_text_field( (string) $in );
					$clean[ $key ] = in_array( $val, $options, true ) ? $val : ( isset( $field['default'] ) ? $field['default'] : ( $options ? $options[0] : '' ) );
					break;

				case 'multi_select':
					$options       = isset( $field['options'] ) ? array_map( 'strval', array_keys( (array) $field['options'] ) ) : array();
					$values        = is_array( $in )
						? array_map( 'sanitize_text_field', array_filter( $in, 'is_scalar' ) )
						: array();
					$clean[ $key ] = array_values( array_unique( array_intersect( $values, $options ) ) );
					break;

				case 'icon':
				case 'color':
				case 'text':
					$clean[ $key ] = sanitize_text_field( (string) $in );
					break;

				case 'group':
					$sub           = isset( $field['fields'] ) ? $field['fields'] : array();
					$clean[ $key ] = self::sanitize( $sub, $in );
					break;

				case 'repeater':
					$sub            = isset( $field['fields'] ) ? $field['fields'] : array();
					$clean[ $key ]  = array();
					if ( is_array( $in ) ) {
						foreach ( $in as $row ) {
							$clean_row = self::sanitize( $sub, $row );
							// Skip rows that are entirely empty (no text/url/image values).
							$has_value = false;
							foreach ( $sub as $fkey => $fdef ) {
								$ftype = isset( $fdef['type'] ) ? $fdef['type'] : 'text';
								if ( in_array( $ftype, array( 'toggle', 'number' ), true ) ) {
									continue;
								}
								if ( 'select' === $ftype || ! isset( $clean_row[ $fkey ] ) ) {
									continue; // Selects carry defaults; they never prove a row is filled.
								}
								$cv = $clean_row[ $fkey ];
								if ( is_array( $cv ) ? ! empty( $cv ) : '' !== trim( (string) $cv ) ) {
									$has_value = true;
									break;
								}
							}
							if ( $has_value ) {
								$clean[ $key ][] = $clean_row;
							}
						}
					}
					break;

				default:
					$clean[ $key ] = sanitize_text_field( (string) $in );
					break;
			}
		}

		return $clean;
	}

	/**
	 * Default value for a single field (used when a stored value is missing).
	 *
	 * @param array $field field definition.
	 * @return mixed
	 */
	public static function field_default( array $field ) {
		if ( isset( $field['default'] ) ) {
			return $field['default'];
		}
		$type = isset( $field['type'] ) ? $field['type'] : 'text';
		if ( 'repeater' === $type ) {
			return array();
		}
		if ( 'multi_select' === $type ) {
			return array();
		}
		if ( 'group' === $type ) {
			$out = array();
			$sub = isset( $field['fields'] ) ? $field['fields'] : array();
			foreach ( $sub as $k => $f ) {
				$out[ $k ] = self::field_default( $f );
			}
			return $out;
		}
		if ( 'toggle' === $type ) {
			return 0;
		}
		if ( 'number' === $type ) {
			return 0;
		}
		return '';
	}
}
