namespace $ {

	export let $mol_jsx_prefix = ''

	export let $mol_jsx_booked = null as null | Set< string >
	
	export let $mol_jsx_document : $mol_jsx.JSX.ElementClass['ownerDocument'] = {
		getElementById : ()=> null ,
		createElement : ( name : string )=> $mol_dom_context.document.createElement( name ),
		createDocumentFragment : ()=> $mol_dom_context.document.createDocumentFragment(),
	}
	
	export const $mol_jsx_frag = ''

	export function $mol_jsx< Props extends { id? : string } , Children extends Array< Node | string > >(
		Elem : string
			| ( ( props : Props , ... children : Children ) => Element ) ,
		props : Props ,
		... childNodes : Children
	) : Element | DocumentFragment {

		const id = props && props.id || ''

		if( Elem && $mol_jsx_booked ) {
			if( $mol_jsx_booked.has( id ) ) {
				$mol_fail( new Error( `JSX already has tag with id ${ JSON.stringify( id ) }` ) )
			} else {
				$mol_jsx_booked.add( id )
			}
		}

		const guid = $mol_jsx_prefix + id

		let node: Element | DocumentFragment | null = guid ? $mol_jsx_document.getElementById( guid ) : null

		if( typeof Elem !== 'string' ) {

			if( 'prototype' in Elem ) {

				const view = node && node[ Elem as any ] || new ( Elem as any )
				
				Object.assign( view , props )
				view[ Symbol.toStringTag ] = guid
				
				view.childNodes = childNodes
				
				if( !view.ownerDocument ) view.ownerDocument = $mol_jsx_document
				
				node = view.valueOf()
				
				node![ Elem as any ] = view
				
				return node!

			} else {

				const prefix = $mol_jsx_prefix
				const booked = $mol_jsx_booked
				
				try {
	
					$mol_jsx_prefix = guid
					$mol_jsx_booked = new Set
	
					return ( Elem as any )( props , ... childNodes )
					
				} finally {

					$mol_jsx_prefix = prefix
					$mol_jsx_booked = booked
	
				}
				
			}

		}

		if( !node ) node = Elem ? $mol_jsx_document.createElement( Elem ) : $mol_jsx_document.createDocumentFragment()

		$mol_dom_render_children( node , ( [] as ( Node | string )[] ).concat( ... childNodes ) )
		if( !Elem ) return node

		for( const key in props ) {

			if( typeof props[ key ] === 'string' ) {

				;( node as Element ).setAttribute( key , props[ key as any ] )

			} else if(
				props[ key ] &&
				typeof props[ key ] === 'object' &&
				Reflect.getPrototypeOf( props[ key ] as any ) === Reflect.getPrototypeOf({})
			) {

				if( typeof node[ key as any ] === 'object' ) {
					Object.assign( ( node as any )[ key ] , props[ key ] )
					continue
				}

			}

			node[ key as any ] = props[ key ]

		}

		if( guid ) ( node as Element ).id = guid

		return node

	}

	export declare namespace $mol_jsx.JSX {

		export interface Element extends HTMLElement {
			class?: string
		}
		
		export interface ElementClass {
			attributes : {}
			ownerDocument : Pick< Document , 'getElementById' | 'createElement' | 'createDocumentFragment' >
			childNodes : Array< Node | string >
			valueOf() : Element
		}
		
		/** Props for html elements */
		export type IntrinsicElements = {
			[ key in keyof HTMLElementTagNameMap ]? : $.$mol_type_partial_deep< Element & HTMLElementTagNameMap[ key ] >
		}
		
		/** Additional undeclared props */
		export interface IntrinsicAttributes {
			id? : string
		}
		
		export interface ElementAttributesProperty {
			attributes : {
			}
		}
		
		// export type IntrinsicClassAttributes< Class > = $.$mol_type_partial_deep< Omit< Class , 'valueOf' > >
		
		interface ElementChildrenAttribute {
		}
	
	}

}
