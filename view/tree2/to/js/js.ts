namespace $ {

	const err = $mol_view_tree2_error_str
	
	function prop_parts( prop: $mol_tree2 ) {
		return [ ...prop.type.matchAll( $mol_view_tree2_prop_signature ) ][0].groups!
	}

	function name_of( prop: $mol_tree2 ) {
		return prop_parts(prop).name
	}
	
	function params_of( prop: $mol_tree2, bidi = true ) {
		
		const { key, next } = prop_parts(prop)

		return prop.struct( '(,)', [
			... key ? [ prop.struct( 'id' ) ] : [],
			... ( bidi && next ) ? [ prop.struct( 'next' ) ] : [],
		] )
		
	}
	
	function args_of( prop: $mol_tree2, bidi = true ) {
		
		const { key, next } = prop_parts(prop)
		
		return prop.struct( '(,)', [
			... key ? [ prop.data( key.length > 1 ? key.slice(1) : 'id' ) ] : [],
			... ( bidi && next ) ? [ prop.struct( 'next' ) ] : [],
		] )
		
	}
	
	const localized_string = $$.$mol_tree2_from_string(`
		()
			this
			[] \\$
			[] \\$mol_locale
			[] \\text
			(,) #key
	`, 'localized_string' )

	function klass_body(
		this: $,
		acc: {
			klass: $mol_tree2
			addons: $mol_tree2[]
			members: $mol_tree2[]
		},
		prop: $mol_tree2
	) {
		const { klass, members, addons } = acc
		const { name, key, next } = prop_parts(prop)

		const decorate = ()=> {
			return prop.struct( '()', [
				prop.struct( key ? '$mol_mem_key' : '$mol_mem' ),
				prop.struct( '(,)', [
					prop.struct( '()', [
						klass.struct( '$' ),
						prop.struct( '[]', [
							klass.data( klass.type ),
						] ),
						prop.struct( '[]', [
							prop.data( 'prototype' ),
						] ),
					] ),
					prop.data( name ),
				] ),
			] )
		}
		
		if( next ) addons.push( decorate() )
		
		const val = prop.hack({
			
			'@': ( locale, belt )=> localized_string.hack({
				'#key': key => [ locale.data( `${ klass.type }_${ name }` ) ],
			}),
			
			'<=': bind => [
				bind.struct( '()', [
					bind.kids[0].struct( 'this' ),
					bind.kids[0].struct( '[]', [
						bind.kids[0].data( name_of( bind.kids[0] ) ),
					] ),
					args_of( bind.kids[0], false ),
				] ),
			],
			
			'<=>': bind => [
				bind.struct( '()', [
					bind.kids[0].struct( 'this' ),
					bind.kids[0].struct( '[]', [
						bind.kids[0].data( name_of( bind.kids[0] ) ),
					] ),
					args_of( bind.kids[0], true ),
				] ),
			],
			
			'=>': bind => [],
			
			'^': ( ref )=> [
				ref.struct( '...', [
					ref.struct( '()', [
						ref.struct( 'super' ),
						ref.struct( '[]', [
							ref.data( name ),
						] ),
						ref.struct( '(,)' )
					]),
				] ),
			],
			
			'*': ( obj, belt )=> [
				
				obj.struct('{,}',
					obj.kids.map( field => {
						
						if( field.type === '^' ) return field.list([ field ]).hack( belt )[0]
						
						return field.struct( ':', [
							field.data( name_of( field ) ),
							field.kids[0].type === '<=>'
								? field.struct( '=>', [
									params_of( field ),
									... field.hack( belt ),
								] )
								: field.hack( belt )[0],
						] )
						
					} ).filter( this.$mol_guard_defined )
				),
				
			],
			
			'': ( input, belt )=> {
				
				if( input.type[0] === '/' ) return [
					input.struct( '[,]', input.hack( belt ) ),
				]
				
				if( /^[$A-Z]/.test( input.type ) ) {
					
					if( !next ) addons.push( decorate() )
					
					const overrides = [] as $mol_tree2[]
					
					for( const over of input.kids ) {
						
						if( over.type === '/' ) continue
						
						const oname = name_of( over )
						const bind = over.kids[0]
						
						if( bind.type === '@' ) {
							
							overrides.push(
								over.struct( '=', [
									over.struct( '()', [
										over.struct( 'obj' ),
										over.struct( '[]', [
											over.data( oname ),
										] ),
									] ),
									over.struct( '=>', [
										params_of( over ),
										... localized_string.hack({
											'#key': key => [ bind.data( `${ klass.type }_${ name }_${ oname }` ) ],
										}),
									] ),
								] ),
							)
							
						} else if( bind.type === '=>' ) {
							
							const pr = bind.kids[0]
							
							members.push(
								pr.struct( '.', [
									pr.data( name_of( pr ) ),
									params_of( pr ),
									bind.struct( '{;}', [
										over.struct( 'return', [
											over.struct( '()', [
												over.struct( 'this' ),
												over.struct( '[]', [
													over.data( oname ),
												] ),
												args_of( over ),
											] ),
										] )
									] ),
								] ),
							)
							
						} else {
							
							overrides.push(
								over.struct( '=', [
									over.struct( '()', [
										over.struct( 'obj' ),
										over.struct( '[]', [
											over.data( oname ),
										] ),
									] ),
									over.struct( '=>', [
										over.struct( '(,)'),
										over.struct( '()', over.hack( belt )),
									] ),
								] ),
							)
							
						}
						
					}
						
					return [
						input.struct( 'const', [
							input.struct( 'obj' ),
							input.struct( 'new', [
								input.struct( input.type ),
								input.struct( '(,)', input.select( '/', null ).hack( belt ) ),
							] ),
						] ),
						... overrides,
						input.struct( 'obj' ),
					]
					
				}
				
				return [ input ]
				
			},
			
		})

		members.push(
			prop.struct( '.', [
				prop.data( name ),
				params_of( prop ),
				prop.struct( '{;}', [
					... next ? [
						prop.struct( 'if', [
							prop.struct( '(!==)', [
								prop.struct( 'next' ),
								prop.struct( 'undefined' ),
							] ),
							prop.struct( 'return', [
								prop.struct( 'next' ),
							] ),
						] ),
					] : [],
					... val.slice( 0, -1 ),
					prop.struct( 'return', val.slice( -1 ) ),
				] ),
			] )
		)

		return acc
	}

	export function $mol_view_tree2_to_js( this: $, descr: $mol_tree2 ) {
		
		descr = $mol_view_tree2_classes( descr )
		
		const definitions = [] as $mol_tree2[]
		
		for( const klass of descr.kids ) {

			const parent = klass.kids[0]
			const props = this.$mol_view_tree2_class_props( klass )
			const addons = [] as $mol_tree2[]
			const members = [] as $mol_tree2[]
			const acc = { klass, addons, members }

			for( const prop of props ) {
				try {
					klass_body.call( this, acc, prop )
				} catch (e: any) {
					e.message += ` at ${prop.span}`
					$mol_fail_hidden(e)
				}
			}

			definitions.push(
				klass.struct( '=', [
					klass.struct( '()', [
						klass.struct( '$' ),
						klass.struct( '[]', [
							klass.data( klass.type ),
						] ),
					] ),
					klass.struct( 'class', [
						klass.struct( klass.type ),
						parent.struct( 'extends', [
							parent.struct( '()', [
								parent.struct( '$' ),
								parent.struct( '[]', [
									parent.data( parent.type ),
								]),
							] ),
						] ),
						klass.struct( '{}', members ),
					] ),
				] ),
				... addons,
			)
			
		}

		return descr.list([
			descr.struct( ';', definitions )
		])
		
	}
}
