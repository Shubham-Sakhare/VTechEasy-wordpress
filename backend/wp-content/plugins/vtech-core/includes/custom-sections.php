<?php
/**
 * Custom sections.
 *
 * Lets admins create reusable sections and define their content fields without
 * editing plugin code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Option key holding every custom section definition. */
define( 'VTECH_CUSTOM_SECTIONS_OPTION', 'vtech_custom_sections' );

/**
 * The generic field schema shared by every custom section.
 *
 * @return array
 */
function vtech_custom_section_schema() {
	return array(
		'eyebrow'     => array( 'type' => 'text', 'label' => 'Eyebrow' ),
		'title'       => array( 'type' => 'text', 'label' => 'Title' ),
		'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
		'image'       => array( 'type' => 'image', 'label' => 'Image' ),
		'body'        => array( 'type' => 'textarea', 'label' => 'Body Text' ),
		'items'       => array(
			'type'       => 'repeater',
			'label'      => 'Items',
			'item_label' => 'Item',
			'fields'     => array(
				'icon'  => array( 'type' => 'icon', 'label' => 'Icon' ),
				'title' => array( 'type' => 'text', 'label' => 'Title' ),
				'desc'  => array( 'type' => 'textarea', 'label' => 'Description' ),
			),
		),
	);
}

/**
 * Content field types available to the section builder.
 *
 * @return array
 */
function vtech_custom_field_types() {
	return array(
		'title'    => 'Title',
		'text'     => 'Text',
		'textarea' => 'Long Text',
		'richtext' => 'Rich Text',
		'number'   => 'Number',
		'email'    => 'Email',
		'url'      => 'Link / URL',
		'image'    => 'Image',
		'icon'     => 'Icon',
		'button'   => 'Button',
		'links'    => 'Links List',
		'items'    => 'Cards / Items',
		'select'   => 'Dropdown',
		'date'     => 'Date',
	);
}

/**
 * Field configuration schema for saved custom-section definitions.
 *
 * @return array
 */
function vtech_custom_field_definition_schema() {
	return array(
		'key'         => array( 'type' => 'text', 'label' => 'Field key (unique)' ),
		'label'       => array( 'type' => 'text', 'label' => 'Field label' ),
		'type'        => array( 'type' => 'select', 'label' => 'Field type', 'options' => vtech_custom_field_types() ),
		'placeholder' => array( 'type' => 'text', 'label' => 'Placeholder / image alt text' ),
		'options'     => array( 'type' => 'textarea', 'label' => 'Choices (one per line, for dropdown)' ),
	);
}

/**
 * Normalize custom section field definitions before saving.
 *
 * @param array $fields submitted field definitions.
 * @return array|WP_Error
 */
function vtech_sanitize_custom_field_definitions( $fields ) {
	if ( ! is_array( $fields ) ) {
		return new WP_Error( 'vtech_custom_fields_invalid', __( 'Add at least one valid section field.', 'vtech-core' ) );
	}
	$allowed = vtech_custom_field_types();
	$clean   = array();
	$used    = array();

	foreach ( $fields as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$key   = isset( $row['key'] ) && is_scalar( $row['key'] ) ? sanitize_key( $row['key'] ) : '';
		$type  = isset( $row['type'] ) && is_scalar( $row['type'] ) ? sanitize_key( $row['type'] ) : '';
		$label = isset( $row['label'] ) && is_scalar( $row['label'] ) ? sanitize_text_field( $row['label'] ) : '';
		if ( '' === $key && '' === $label && '' === $type ) {
			continue;
		}
		if ( ! preg_match( '/^[a-z][a-z0-9_]{0,39}$/', $key ) || isset( $used[ $key ] ) ||
			in_array( $key, array( 'placement', 'parent_page', 'advanced', '_custom_fields' ), true ) ||
			! isset( $allowed[ $type ] ) || '' === $label ) {
			return new WP_Error( 'vtech_custom_field_invalid', __( 'Each field needs a unique key (letters, numbers, underscores), a label, and a supported type.', 'vtech-core' ) );
		}
		$used[ $key ] = true;
		$options      = isset( $row['options'] ) && is_scalar( $row['options'] ) ? preg_split( '/\r\n|\r|\n/', (string) $row['options'] ) : array();
		$options      = array_values( array_unique( array_filter( array_map( 'sanitize_text_field', $options ), 'strlen' ) ) );
		if ( 'select' === $type && empty( $options ) ) {
			return new WP_Error( 'vtech_custom_field_options', sprintf( __( 'Add at least one choice for the "%s" dropdown.', 'vtech-core' ), $label ) );
		}
		$clean[] = array(
			'key'         => $key,
			'label'       => $label,
			'type'        => $type,
			'placeholder' => isset( $row['placeholder'] ) && is_scalar( $row['placeholder'] ) ? sanitize_text_field( $row['placeholder'] ) : '',
			'options'     => $options,
		);
		if ( count( $clean ) > 30 ) {
			return new WP_Error( 'vtech_custom_field_limit', __( 'A section can have up to 30 fields.', 'vtech-core' ) );
		}
	}

	if ( empty( $clean ) ) {
		return new WP_Error( 'vtech_custom_fields_empty', __( 'Add at least one field to your section.', 'vtech-core' ) );
	}

	return $clean;
}

/**
 * Build the content schema from a custom section's field definitions.
 *
 * @param array $definitions custom field definitions.
 * @return array
 */
function vtech_custom_section_schema_from_fields( $definitions ) {
	$schema = array();
	foreach ( (array) $definitions as $field ) {
		if ( ! is_array( $field ) || empty( $field['key'] ) || empty( $field['type'] ) ) {
			continue;
		}
		$key   = sanitize_key( $field['key'] );
		$type  = $field['type'];
		$label = isset( $field['label'] ) ? $field['label'] : ucfirst( $key );
		switch ( $type ) {
			case 'richtext':
				$schema[ $key ] = array( 'type' => 'editor', 'label' => $label );
				break;
			case 'button':
				$schema[ $key ] = array(
					'type'        => 'group',
					'label'       => $label,
					'collapsible' => false,
					'fields'      => array(
						'label' => array( 'type' => 'text', 'label' => 'Button text' ),
						'url'   => array( 'type' => 'url', 'label' => 'Button link' ),
						'icon'  => array( 'type' => 'icon', 'label' => 'Button icon' ),
					),
				);
				break;
			case 'links':
				$schema[ $key ] = array(
					'type'       => 'repeater',
					'label'      => $label,
					'item_label' => 'Link',
					'fields'     => array(
						'label' => array( 'type' => 'text', 'label' => 'Link text' ),
						'url'   => array( 'type' => 'url', 'label' => 'Link URL' ),
					),
				);
				break;
			case 'items':
				$schema[ $key ] = array(
					'type'       => 'repeater',
					'label'      => $label,
					'item_label' => 'Item',
					'fields'     => array(
						'icon'        => array( 'type' => 'icon', 'label' => 'Icon' ),
						'title'       => array( 'type' => 'text', 'label' => 'Title' ),
						'description' => array( 'type' => 'textarea', 'label' => 'Description' ),
						'image'       => array( 'type' => 'image', 'label' => 'Image' ),
						'button_text' => array( 'type' => 'text', 'label' => 'Button text' ),
						'button_url'  => array( 'type' => 'url', 'label' => 'Button link' ),
					),
				);
				break;
			case 'select':
				$options = array();
				foreach ( isset( $field['options'] ) && is_array( $field['options'] ) ? $field['options'] : array() as $option ) {
					$options[ $option ] = $option;
				}
				$schema[ $key ] = array( 'type' => 'select', 'label' => $label, 'options' => $options );
				break;
			default:
				$schema[ $key ] = array( 'type' => $type, 'label' => $label, 'placeholder' => isset( $field['placeholder'] ) ? $field['placeholder'] : '' );
				break;
		}
	}
	return $schema;
}

/**
 * Build blank stored content for a custom section.
 *
 * @param array $definitions custom field definitions.
 * @return array
 */
function vtech_custom_section_defaults_for_fields( $definitions ) {
	$defaults = array();
	foreach ( vtech_custom_section_schema_from_fields( $definitions ) as $key => $field ) {
		$defaults[ $key ] = VTech_Schema::field_default( $field );
	}
	return $defaults;
}

/**
 * Default (empty) content for a custom section.
 *
 * @return array
 */
function vtech_custom_section_defaults( $definitions = array() ) {
	if ( ! empty( $definitions ) ) {
		return array_merge( vtech_custom_section_defaults_for_fields( $definitions ), array( 'placement' => array() ) );
	}
	return array(
		'eyebrow'     => '',
		'title'       => '',
		'description' => '',
		'image'       => '',
		'body'        => '',
		'items'       => array(),
		'placement'   => array(),
	);
}

/**
 * All stored custom section definitions.
 *
 * @return array list of array( 'id', 'label', 'icon' ).
 */
function vtech_get_custom_sections() {
	$defs = get_option( VTECH_CUSTOM_SECTIONS_OPTION, array() );
	return is_array( $defs ) ? array_values( $defs ) : array();
}

/**
 * Persist the custom section definitions.
 *
 * @param array $defs definitions.
 */
function vtech_save_custom_sections( $defs ) {
	update_option( VTECH_CUSTOM_SECTIONS_OPTION, array_values( (array) $defs ) );
}

/**
 * Write a section's content straight into the option.
 *
 * Custom sections are saved from the Sections screen *before* they have been
 * registered for the current request, so we cannot go through the normalised
 * helper (which only keeps registered sections).
 *
 * @param string $id   section id.
 * @param array  $data sanitized content.
 */
function vtech_custom_save_content( $id, $data ) {
	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( ! is_array( $content ) ) {
		$content = array();
	}
	if ( ! isset( $content['sections'] ) || ! is_array( $content['sections'] ) ) {
		$content['sections'] = array();
	}
	$content['sections'][ $id ] = $data;
	update_option( VTECH_CORE_OPTION, $content );
}

/**
 * Create a custom section definition + its initial placement.
 *
 * @param array $args array( 'label', 'id' (optional), 'icon', 'owner', 'fields' ).
 * @return string|WP_Error the new section id.
 */
function vtech_add_custom_section( $args ) {
	$label = isset( $args['label'] ) && is_scalar( $args['label'] ) ? trim( (string) $args['label'] ) : '';
	if ( '' === $label ) {
		return new WP_Error( 'vtech_no_label', __( 'Please enter a section name.', 'vtech-core' ) );
	}
	$field_definitions = isset( $args['fields'] ) ? vtech_sanitize_custom_field_definitions( $args['fields'] ) : array(
		array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text' ),
		array( 'key' => 'title', 'label' => 'Title', 'type' => 'title' ),
		array( 'key' => 'description', 'label' => 'Description', 'type' => 'textarea' ),
		array( 'key' => 'image', 'label' => 'Image', 'type' => 'image' ),
		array( 'key' => 'body', 'label' => 'Body Text', 'type' => 'textarea' ),
		array( 'key' => 'items', 'label' => 'Items', 'type' => 'items' ),
	);
	if ( is_wp_error( $field_definitions ) ) {
		return $field_definitions;
	}

	$defs  = vtech_get_custom_sections();
	$taken = array();
	foreach ( $defs as $d ) {
		$taken[] = $d['id'];
	}

	$id = isset( $args['id'] ) && is_scalar( $args['id'] ) && '' !== trim( (string) $args['id'] ) ? sanitize_key( $args['id'] ) : sanitize_key( $label );
	if ( '' === $id ) {
		$id = 'section';
	}
	// Never collide with a built-in or an existing custom section.
	while ( in_array( $id, $taken, true ) || VTech_Sections::get( $id ) ) {
		$id .= '-' . wp_rand( 10, 99 );
	}

	$owner = isset( $args['owner'] ) && is_scalar( $args['owner'] ) ? sanitize_key( $args['owner'] ) : '';
	if ( '' === $owner || ! VTech_Pages::exists( $owner ) ) {
		$owner = 'home';
	}

	$defs[] = array(
		'id'         => $id,
		'label'      => $label,
		'icon'       => isset( $args['icon'] ) && is_scalar( $args['icon'] ) && '' !== $args['icon'] ? sanitize_text_field( $args['icon'] ) : 'dashicons-block-default',
		'owner_page' => $owner,
		'fields'     => $field_definitions,
	);
	vtech_save_custom_sections( $defs );

	// Seed the content + placement so the section shows up immediately.
	$data = vtech_custom_section_defaults( $field_definitions );
	if ( isset( $args['placement'] ) && is_array( $args['placement'] ) ) {
		$data['placement'] = $args['placement'];
	}
	// The owner page always shows its own section.
	$data['placement'][ $owner ] = array( 'show' => 1, 'order' => 1 );
	vtech_custom_save_content( $id, $data );

	return $id;
}

/**
 * Delete a custom section definition + its stored content.
 *
 * @param string $id section id.
 * @return bool
 */
function vtech_delete_custom_section( $id ) {
	$id    = sanitize_key( $id );
	$defs  = vtech_get_custom_sections();
	$keep  = array();
	$found = false;
	foreach ( $defs as $d ) {
		if ( isset( $d['id'] ) && $d['id'] === $id ) {
			$found = true;
			continue;
		}
		$keep[] = $d;
	}
	if ( ! $found ) {
		return false;
	}
	vtech_save_custom_sections( $keep );

	// Drop the stored content.
	$content = get_option( VTECH_CORE_OPTION, array() );
	if ( is_array( $content ) && isset( $content['sections'][ $id ] ) ) {
		unset( $content['sections'][ $id ] );
		update_option( VTECH_CORE_OPTION, $content );
	}

	return true;
}