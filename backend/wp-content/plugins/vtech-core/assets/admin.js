/* global jQuery, VTechAdmin, wp */
( function ( $ ) {
	'use strict';

	/**
	 * Minimal Feather icon SVG inner-markup map (24x24, stroke based).
	 * Only used for the admin preview; the React app renders the real icons.
	 * Icons without a drawing fall back to a generic dot.
	 */
	var FEATHER = {
		'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
		'grid': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
		'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
		'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
		'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
		'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
		'mail': '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
		'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
		'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
		'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
		'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
		'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
		'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
		'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
		'smartphone': '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
		'cloud': '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
		'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
		'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
		'heart': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
		'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
		'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
		'send': '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
		'play': '<polygon points="5 3 19 12 5 21 5 3"/>',
		'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
		'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
		'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
		'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
		'layout': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
		'monitor': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
		'pen-tool': '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
		'image': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
		'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
		'shopping-cart': '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
		'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
		'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
		'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
		'thumbs-up': '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
		'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
		'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
		'facebook': '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
		'instagram': '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
		'linkedin': '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
		'twitter': '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>',
		'youtube': '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
		'github': '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'
	};

	function svg( name ) {
		var inner = FEATHER[ name ] || '<circle cx="12" cy="12" r="4"/>';
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
	}

	/* ---------------- Repeater reindexing ---------------- */

	// Rewrites the first [N] group of name="..." attributes within a container
	// so that indices run 0..n sequentially after add/remove/sort.
	function reindexTopLevel( $repeater ) {
		// Schema repeaters carry the real field base in data-base
		// (e.g. "section[services][items]"); the legacy header/footer
		// repeaters only have data-repeater (e.g. "columns").
		var base = $repeater.data( 'base' );
		var key = base || $repeater.data( 'repeater' );
		var re = base
			? new RegExp( '^(' + escapeRe( base ) + ')\\[\\d+\\]' )
			: new RegExp( '(' + escapeRe( key ) + ')\\[\\d+\\]' );

		var $rows = $repeater.children( '.vtech-repeater-items' ).children( '.vtech-row' );
		$rows.each( function () {
			var $row = $( this );
			$row.find( '.vtech-wp-editor' ).each( function () {
				var editorId = $( this ).attr( 'id' );
				if ( window.wp && wp.editor && editorId && wp.editor.remove ) {
					if ( window.tinymce && tinymce.get( editorId ) ) {
						tinymce.get( editorId ).save();
					}
					wp.editor.remove( editorId );
				}
			} );
		} );
		$rows.each( function ( i ) {
			var $row = $( this );
			$row.find( '[name]' ).each( function () {
				var n = $( this ).attr( 'name' );
				$( this ).attr( 'name', n.replace( re, '$1[' + i + ']' ) );
			} );
			$row.find( '[data-sub-items]' ).attr( 'data-sub-items', i );
			$row.find( '.vtech-add-sub' ).attr( 'data-parent', i );
		} );
		$rows.each( function () {
			var $row = $( this );
			// Upgrade any template editors (cloned from the row template) into
			// real editor textareas now that they have a concrete index.
			$row.find( '.vtech-wp-editor-tmpl' ).removeClass( 'vtech-wp-editor-tmpl' ).addClass( 'vtech-wp-editor' );
			$row.find( '.vtech-wp-editor' ).each( function () {
				var name = $( this ).attr( 'name' );
				var editorId = 'vtech-editor-' + name.replace( /[^a-zA-Z0-9_-]/g, '-' );
				$( this ).attr( 'id', editorId );
				// Skip editors inside a collapsed/hidden row — they are
				// initialized when the row is expanded, preventing an
				// orphaned editor box from rendering outside the row.
				if ( $( this ).closest( '.vtech-row-body[hidden]' ).length ) {
					return;
				}
				initializeRichEditor( this );
			} );
		} );
	}

	function initializeRichEditor( textarea ) {
		if ( ! window.wp || ! wp.editor || ! wp.editor.initialize || ! textarea.id ) {
			return;
		}
		wp.editor.initialize( textarea.id, {
			tinymce: {
				wpautop: true,
				height: 320,
				menubar: false,
				toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,undo,redo',
				toolbar2: 'strikethrough,hr,removeformat,pastetext,outdent,indent,wp_help',
				setup: function ( editor ) {
					editor.on( 'input change undo redo keyup', function () {
						editor.save();
					} );
				},
			},
			quicktags: true,
			mediaButtons: true,
		} );
	}

	$( function () {
		/* Make legacy top-level admin panels collapsible (e.g. Header/Footer). */
		$( '.vtech-form > .vtech-panel:not(.vtech-section-block)' ).each( function () {
			var $panel = $( this );
			var $heading = $panel.children( '.vtech-panel-title' ).first();
			if ( ! $heading.length || $panel.children( '.vtech-admin-panel-toggle' ).length ) {
				return;
			}
			var $toggle = $( '<button type="button" class="vtech-admin-panel-toggle" aria-expanded="true"></button>' );
			$toggle.append( '<span class="vtech-panel-title-content">' + $heading.html() + '</span>' );
			$toggle.append( '<span class="dashicons dashicons-arrow-down-alt2" aria-hidden="true"></span>' );
			var $body = $( '<div class="vtech-admin-panel-body"></div>' );
			$heading.nextAll().appendTo( $body );
			$heading.replaceWith( $toggle );
			$panel.append( $body );
		} );

		// Only initialize editors that are actually visible on load. Editors
		// inside collapsed repeater rows are initialized when the row is
		// expanded (see the row-toggle handler); initializing them while their
		// container is hidden makes TinyMCE render an orphaned editor box
		// outside the row.
		$( '.vtech-wp-editor' ).each( function () {
			if ( $( this ).closest( '.vtech-row-body[hidden]' ).length ) {
				return;
			}
			initializeRichEditor( this );
		} );
		$( '.vtech-form' ).on( 'submit', function () {
			if ( window.tinymce ) {
				$( this ).find( '.vtech-wp-editor' ).each( function () {
					var editor = tinymce.get( this.id );
					if ( editor ) {
						editor.save();
					}
				} );
				tinymce.triggerSave();
			}
		} );
	} );

	function reindexSub( $subItems, parentIndex ) {
		$subItems.children( '.vtech-subrow' ).each( function ( ci ) {
			$( this ).find( '[name]' ).each( function () {
				var n = $( this ).attr( 'name' );
				// Replace the SECOND bracket group (the child index).
				var m = n.match( /^(.*?\[\d+\]\[[a-z]+\])\[\d+\](.*)$/i );
				if ( m ) {
					$( this ).attr( 'name', m[ 1 ] + '[' + ci + ']' + m[ 2 ] );
				}
			} );
		} );
	}

	function escapeRe( s ) {
		return String( s ).replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

	// Simple deterministic hash (djb2) so a repeater's template id can be
	// regenerated from its (now concrete) data-base after a parent row clone.
	function hashId( str ) {
		var h = 5381;
		for ( var i = 0; i < str.length; i++ ) {
			h = ( ( h << 5 ) + h + str.charCodeAt( i ) ) >>> 0;
		}
		return 'rep-js-' + h.toString( 36 );
	}

	// Give every nested repeater inside $scope a fresh, unique template id and
	// matching add-button target + <template> id. Called after cloning a row
	// that may contain nested repeaters whose ids were hashed from the
	// placeholder "__INDEX__" name (and would otherwise collide).
	function fixNestedRepeaters( $scope ) {
		$scope.find( '.vtech-repeater' ).each( function () {
			var $rep = $( this );
			var base = $rep.data( 'base' );
			if ( ! base || base.indexOf( '__INDEX__' ) !== -1 ) {
				return; // not reindexed yet; skip (shouldn't happen post-reindex)
			}
			var newId = hashId( base );
			$rep.attr( 'data-repeater', newId );
			$rep.children( '.vtech-add' ).attr( 'data-target', newId );
			// Re-id the row <template> that belongs to THIS repeater. The
			// template is a sibling emitted right after the repeater markup.
			var $tmpl = $rep.find( '> template, ~ template' ).filter( function () {
				return /^vtech-tmpl-/.test( this.id );
			} ).first();
			if ( ! $tmpl.length ) {
				$tmpl = $rep.nextAll( 'template[id^="vtech-tmpl-"]' ).first();
			}
			if ( $tmpl.length ) {
				$tmpl.attr( 'id', 'vtech-tmpl-' + newId );
			}
		} );
	}

	function tmpl( id, replacements ) {
		var el = document.getElementById( 'vtech-tmpl-' + id );
		// <template> exposes its markup via .innerHTML; fall back to jQuery
		// .html() for any legacy inline-script templates.
		var html = el
			? ( typeof el.innerHTML === 'string' ? el.innerHTML : $( el ).html() )
			: ( $( '#vtech-tmpl-' + id ).html() || '' );
		html = html || '';
		$.each( replacements, function ( token, value ) {
			html = html.split( token ).join( value );
		} );
		return html;
	}

	/* ---------------- Init ---------------- */

	$( function () {

		/* Media uploader (logo) */
		$( document ).on( 'click', '.vtech-media-upload', function ( e ) {
			e.preventDefault();
			var $field = $( this ).closest( '.vtech-media' );
			var frame = wp.media( {
				title: 'Select image',
				multiple: false,
				library: { type: 'image' },
				button: { text: 'Use this image' }
			} );
			frame.on( 'select', function () {
				var att = frame.state().get( 'selection' ).first().toJSON();
				$field.find( '.vtech-media-input' ).val( att.url );
				$field.addClass( 'has-image' );
				$field.find( '.vtech-media-preview' ).html( '<img src="' + att.url + '" alt="" />' );
			} );
			frame.open();
		} );

		$( document ).on( 'click', '.vtech-media-remove', function ( e ) {
			e.preventDefault();
			var $field = $( this ).closest( '.vtech-media' );
			$field.find( '.vtech-media-input' ).val( '' );
			$field.removeClass( 'has-image' );
			$field.find( '.vtech-media-preview' ).html( '<span class="vtech-media-empty dashicons dashicons-format-image"></span>' );
		} );

		/* "Add to Feature" switch: reveal the page/order picker live. */
		$( document ).on( 'change', '.vtech-feature-toggle input[type=checkbox]', function () {
			$( this ).closest( '.vtech-section-block' ).toggleClass( 'is-on', $( this ).is( ':checked' ) );
		} );

		/* ---------------- Collapse / expand section panel ---------------- */

		function setSectionState( $panel, open ) {
			$panel.toggleClass( 'is-open', open );
			$panel.find( '> .vtech-section-head .vtech-collapse' ).attr( 'aria-expanded', open ? 'true' : 'false' );
		}

		// The arrow button toggles its own section.
		$( document ).on( 'click', '.vtech-collapse', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			var $panel = $( this ).closest( '.vtech-section-block' );
			setSectionState( $panel, ! $panel.hasClass( 'is-open' ) );
		} );

		// Clicking anywhere else in the header works too, but never when the
		// user is on an input (order box) or the button itself.
		$( document ).on( 'click', '.vtech-section-head', function ( e ) {
			if ( $( e.target ).closest( 'input, button, label, select, textarea, a' ).length ) {
				return;
			}
			var $panel = $( this ).closest( '.vtech-section-block' );
			setSectionState( $panel, ! $panel.hasClass( 'is-open' ) );
		} );

		// Expand / collapse everything.
		$( document ).on( 'click', '.vtech-expand-all', function ( e ) {
			e.preventDefault();
			$( '.vtech-section-block' ).each( function () {
				setSectionState( $( this ), true );
			} );
		} );
		$( document ).on( 'click', '.vtech-collapse-all', function ( e ) {
			e.preventDefault();
			$( '.vtech-section-block' ).each( function () {
				setSectionState( $( this ), false );
			} );
		} );

		/* Collapse / expand Blog article rows without affecting other repeaters. */
		$( document ).on( 'click', '.vtech-row-toggle', function () {
			var $button = $( this );
			var $row = $button.closest( '.vtech-row-collapsible' );
			var open = $row.hasClass( 'is-collapsed' );
			$row.toggleClass( 'is-collapsed', ! open );
			$button.attr( 'aria-expanded', open ? 'true' : 'false' );
			$row.children( '.vtech-row-body' ).prop( 'hidden', ! open );
			if ( open ) {
				// Initialize (or repaint) any rich editors now that the row is
				// visible. Editors are not initialized while collapsed to avoid
				// an orphaned editor box rendering outside the row.
				$row.find( '.vtech-wp-editor' ).each( function () {
					var existing = window.tinymce ? tinymce.get( this.id ) : null;
					if ( existing ) {
						existing.execCommand( 'mceRepaint' );
					} else {
						initializeRichEditor( this );
					}
				} );
			}
		} );

		function setAdminPanelState( $panel, $button, $body, open ) {
			$panel.toggleClass( 'is-collapsed', ! open );
			$button.attr( 'aria-expanded', open ? 'true' : 'false' );
			$body.prop( 'hidden', ! open );
		}

		$( document ).on( 'click', '.vtech-group-toggle', function () {
			var $button = $( this );
			var $panel = $button.closest( '.vtech-group-collapsible' );
			var open = $panel.hasClass( 'is-collapsed' );
			setAdminPanelState( $panel, $button, $panel.children( '.vtech-group-body' ), open );
		} );

		$( document ).on( 'click', '.vtech-repeater-toggle', function () {
			var $button = $( this );
			var $panel = $button.closest( '.vtech-repeater-panel' );
			var open = $panel.hasClass( 'is-collapsed' );
			setAdminPanelState( $panel, $button, $panel.children( '.vtech-repeater-panel-body' ), open );
		} );

		$( document ).on( 'click', '.vtech-admin-panel-toggle', function () {
			var $button = $( this );
			var $panel = $button.closest( '.vtech-panel' );
			var $body = $panel.children( '.vtech-admin-panel-body' );
			var open = $body.prop( 'hidden' );
			$body.prop( 'hidden', ! open );
			$button.attr( 'aria-expanded', open ? 'true' : 'false' );
			$panel.toggleClass( 'is-collapsed', ! open );
		} );

		$( document ).on( 'input', '.vtech-row-collapsible input', function () {
			var $input = $( this );
			var $row = $input.closest( '.vtech-row-collapsible' );
			var titleField = $row.data( 'title-field' );
			if ( ! titleField || ! new RegExp( '\\[' + escapeRe( titleField ) + '\\]$' ).test( $input.attr( 'name' ) || '' ) ) {
				return;
			}
			var title = $.trim( $input.val() );
			$row.find( '.vtech-row-title' ).text( title || $row.data( 'title-fallback' ) );
		} );

		/* Add top-level repeater row */
		$( document ).on( 'click', '.vtech-add', function ( e ) {
			e.preventDefault();
			var target = $( this ).data( 'target' );
			var $repeater = $( this ).closest( '.vtech-repeater' );
			var $items = $repeater.children( '.vtech-repeater-items' );
			var index = $items.children( '.vtech-row' ).length;
			var $new = $( tmpl( target, { '__INDEX__': index } ) );
			$items.append( $new );
			reindexTopLevel( $repeater );
			// A freshly cloned row may itself contain nested repeaters whose
			// template ids / add-targets were hashed from the "__INDEX__"
			// name and therefore collide with the row template. Re-key every
			// nested repeater inside the new row so each gets a unique id/base
			// and its "+ Add" button targets its own template.
			fixNestedRepeaters( $items.children( '.vtech-row' ).last() );
		} );

		/* Remove any row (top-level or sub) */
		$( document ).on( 'click', '.vtech-remove', function ( e ) {
			e.preventDefault();
			// Guard against accidental clicks — rows contain real content.
			var msg = $( this ).data( 'vtech-confirm' );
			if ( msg && ! window.confirm( msg ) ) {
				return;
			}
			var $row = $( this ).closest( '.vtech-row' );
			$row.find( '.vtech-wp-editor' ).each( function () {
				var editorId = $( this ).attr( 'id' );
				if ( window.wp && wp.editor && wp.editor.remove && editorId ) {
					wp.editor.remove( editorId );
				}
			} );
			var $repeater = $row.closest( '.vtech-repeater' );
			var $subItems = $row.closest( '.vtech-sub-items' );
			$row.remove();
			if ( $subItems.length ) {
				reindexSub( $subItems, $subItems.data( 'sub-items' ) );
			}
			if ( $repeater.length ) {
				reindexTopLevel( $repeater );
			}
		} );

		/* Add sub-item (header sub-menu OR footer column link) */
		$( document ).on( 'click', '.vtech-add-sub', function ( e ) {
			e.preventDefault();
			var parent = $( this ).data( 'parent' );
			var sub = $( this ).data( 'sub' ) || 'submenu';
			var $subItems = $( this ).closest( '.vtech-sub-block' ).find( '.vtech-sub-items' );
			var ci = $subItems.children( '.vtech-subrow' ).length;
			$subItems.append( tmpl( sub, { '__INDEX__': parent, '__CINDEX__': ci } ) );
		} );

		/* Sortable top-level rows */
		$( '.vtech-repeater-items' ).sortable( {
			handle: '.vtech-drag',
			items: '> .vtech-row',
			placeholder: 'vtech-row vtech-sort-ph',
			forcePlaceholderSize: true,
			update: function () {
				reindexTopLevel( $( this ).closest( '.vtech-repeater' ) );
				if ( window.tinymce ) {
					tinymce.triggerSave();
				}
			}
		} );

		$( '.vtech-page-section-list' ).sortable( {
			handle: '.vtech-page-section-drag',
			items: '> .vtech-page-section-row',
			placeholder: 'vtech-page-layout-row vtech-page-layout-placeholder',
			forcePlaceholderSize: true,
		} );

		/* ---------------- Icon picker modal ---------------- */

		var icons = ( window.VTechAdmin && VTechAdmin.icons ) || [];
		var $backdrop = $(
			'<div class="vtech-modal-backdrop"><div class="vtech-modal">' +
			'<div class="vtech-modal-head"><h3>Pick an icon</h3>' +
			'<input type="text" class="vtech-modal-search" placeholder="Search icons..." />' +
			'<button type="button" class="vtech-modal-close dashicons dashicons-no-alt"></button></div>' +
			'<div class="vtech-icon-grid"></div></div></div>'
		);
		$( 'body' ).append( $backdrop );
		var $grid = $backdrop.find( '.vtech-icon-grid' );
		var $search = $backdrop.find( '.vtech-modal-search' );
		var activeInput = null;

		function renderIcons( filter ) {
			filter = ( filter || '' ).toLowerCase();
			$grid.empty();
			icons.forEach( function ( name ) {
				if ( filter && name.indexOf( filter ) === -1 ) {
					return;
				}
				$grid.append(
					'<button type="button" class="vtech-icon-opt" data-icon="' + name + '">' +
					svg( name ) + '<span>' + name + '</span></button>'
				);
			} );
		}

		function openModal( $input ) {
			activeInput = $input;
			$search.val( '' );
			renderIcons( '' );
			$backdrop.addClass( 'open' );
			$search.trigger( 'focus' );
		}

		function closeModal() {
			$backdrop.removeClass( 'open' );
			activeInput = null;
		}

		$( document ).on( 'click', '.vtech-icon-open', function ( e ) {
			e.preventDefault();
			openModal( $( this ).closest( '.vtech-icon-control' ).find( '.vtech-icon-input' ) );
		} );


		$( document ).on( 'click', '.vtech-icon-img-upload', function ( e ) {
			e.preventDefault();
			var $btn   = $( this );
			var $field = $btn.closest( '.vtech-iconpicker' );
			var $input = $field.find( '.vtech-icon-input' );
			var frame  = wp.media( {
				title: 'Select icon image',
				multiple: false,
				library: { type: 'image' },
				button: { text: 'Use as icon' }
			} );
			frame.on( 'select', function () {
				var att = frame.state().get( 'selection' ).first().toJSON();
				$input.val( att.url );
				$field.find( '.vtech-icon-img-preview' ).remove();
				$field.append( '<div class="vtech-icon-img-preview"><img src="' + att.url + '" alt="" /></div>' );
				updateIconPreview( $input );
			} );
			frame.open();
		} );

		function updateIconPreview( $input ) {
			var name = $input.val();
			var $control = $input.closest( '.vtech-icon-control' );
			$control.find( '.vtech-icon-preview' ).remove();
			if ( name ) {
				$control.prepend( '<span class="vtech-icon-preview">' + svg( name ) + '</span>' );
			}
		}

		// Init previews for already-saved icons on page load.
		$( '.vtech-icon-input' ).each( function () {
			updateIconPreview( $( this ) );
		} );

		$backdrop.on( 'click', '.vtech-icon-opt', function () {
			if ( activeInput ) {
				activeInput.val( $( this ).data( 'icon' ) );
				updateIconPreview( activeInput );
			}
			closeModal();
		} );

		$( document ).on( 'click', '.vtech-icon-clear', function ( e ) {
			e.preventDefault();
			var $input = $( this ).closest( '.vtech-icon-control' ).find( '.vtech-icon-input' );
			$input.val( '' );
			updateIconPreview( $input );
		} );

		$backdrop.on( 'input', '.vtech-modal-search', function () {
			renderIcons( $( this ).val() );
		} );

		$backdrop.on( 'click', '.vtech-modal-close', closeModal );
		$backdrop.on( 'click', function ( e ) {
			if ( e.target === this ) {
				closeModal();
			}
		} );
	} );

} )( jQuery );
