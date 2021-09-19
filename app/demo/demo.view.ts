namespace $.$$ {
	
	export class $mol_app_demo extends $.$mol_app_demo {
		
		detail_title() {
			const selected = this.selected()
			if( selected ) {
				const names = this.names_demo() 
				/*if( names.length === 1 ) {
					return `$${ selected.replace( /_demo.* / , '' ) }: ${ this.Sample_large( names[0] ).Widget().title() }`
				}*/
				return `$${ selected }`
			}
			
			return super.title()
		}

		@ $mol_mem
		names_demo_all() {
			var next : string[] = []
			for( var name in this.$ ) {
				if( !/^\$.*_demo($|_)/i.test( name ) ) continue
				if( /^\$mol_demo/.test( name ) ) continue
				if( /^\$mol_app_demo/.test( name ) ) continue
				if( typeof this.$[ name ] !== 'function' ) continue
				next.push( name.substring( 1 ) )
			}
			return next.sort()
		}
		
		// @ $mol_mem
		// nav_hierarchy() {
		// 	const names = this.names_demo_filtered()
			
		// 	const hierarchy = {} as { [ prefix : string ] : $mol_grid_node }
		// 	const root = hierarchy[ '' ] = {
		// 		id : '' ,
		// 		parent : null as any as $mol_grid_node ,
		// 		sub : [] as $mol_grid_node[] ,
		// 	}
			
		// 	names.forEach( name => {
		// 		const chunks = name.split( /(?=[_.-])/ )
		// 		let branch = root
		// 		for( let i = 1 ; i <= chunks.length ; ++ i ) {
		// 			const prefix = chunks.slice( 0 , i ).join( '' )
		// 			if( !hierarchy[ prefix ] ) {
		// 				branch.sub.push( hierarchy[ prefix ] = {
		// 					id : prefix ,
		// 					parent : branch ,
		// 					sub : [] as $mol_grid_node[] ,
		// 				} )
		// 			}
		// 			branch = hierarchy[ prefix ]
		// 		}
		// 	} )
			
		// 	hierarchy[ '' ].sub.map( child => reduce( child ) )
			
		// 	function reduce( node : $mol_grid_node ) {
		// 		if( names.indexOf( node.id ) >= 0 ) return node
				
		// 		node.sub = node.sub.map( child => reduce( child ) )
		// 		if( node.sub.length !== 1 ) return node
				
		// 		node.sub[0].parent = node.parent
		// 		return node.sub[0]
		// 	}
			
		// 	return hierarchy
		// }
		
		// nav_option( id : string ) {
		// 	const parent = this.nav_hierarchy()[ id ].parent
			
		// 	const title = `$${ id }`
		// 	.substring( parent.id.length + 1 )
		// 	.replace( /^[-._]|[-._]demo$/g , '' )
		// 	.replace( /_/g , ' ' )
		// 	.replace( /^(\w)/ , letter => letter.toUpperCase() )
			
		// 	return { title }
		// }
		
		selected() {
			return $mol_state_arg.value( 'demo' ) || ''
		}

		selected_class_name() {
			return '$' + this.selected()
		}

		@ $mol_mem
		Widget() {
			return $mol_atom2_dict({
				get : ( name : string )=> {
					const Class : typeof $mol_view = this.$[ '$' + name ]
					return new Class()
				}
			})
		}
		
		@ $mol_mem
		names_demo() {
			const selected = this.selected()
			return [ selected ]
			// const all = this.names_demo_all()
			
			// const root = this.nav_hierarchy()[ selected ]
			// if( !root ) return []

			// const names : string[] = []
			// const collect = ( node : typeof root )=> {
			// 	const demo = `${ node.id }_demo`
			// 	if( all.indexOf( demo ) !== -1 ) {
			// 		if( names.indexOf( demo ) === -1 ) names.push( demo )
			// 	} else if( all.indexOf( node.id ) !== -1 ) {
			// 		if( names.indexOf( node.id ) === -1 ) names.push( node.id )
			// 	} else {
			// 		node.sub.forEach( child => collect( child ) )
			// 	}
			// }

			// if( root.sub.length ) root.sub.forEach( child => collect( child ) )
			// collect( root )
			
			// return names
		}
		
		blocks() {
			let sub : $mol_view[] = []
			
			sub.push( this.Menu() )
			
			const selected = this.selected()
			if( selected ) {
				sub.push( this.Detail( selected ) )
				sub.push( ... this.chat_pages( selected ) )
			}
			
			return sub
		}

		Demo() {
			return this.Widget()[ this.selected() ]
		}
		
		chat_seed( id: string ) {
			return '#!demo=' + id
		}
		
		logo_uri() {
			return $mol_file.relative( '/mol/logo/logo.svg' ).path()
		}

		source_link() {
			
			const demo = $mol_state_arg.value('demo')
			if( !demo ) return this.source_prefix()

			const pieces = demo.split('_').slice(1)
			const source_link = this.source_prefix() + pieces.join('/')

			return source_link
		}

		chat_link() {
			return $mol_state_arg.make_link({ demo : this.selected() })
		}
		
		@ $mol_mem
		edit_uri() {
			const source = encodeURIComponent( `$${''}my_app $${ this.selected() }` )
			const pack = encodeURIComponent( this.$.$mol_state_arg.make_link({}) )
			return `https://studio.hyoo.ru/#!pack=${ pack }/source=${ source }/preview`
		}
		
	}
	
	export class $mol_app_demo_menu extends $.$mol_app_demo_menu {
		
		@ $mol_mem
		names_filtered() {
			const filter = this.filter().toLowerCase()
			const names = this.names().filter( name => ( name.toLowerCase().indexOf( filter ) != -1 ) )
			return names
		}
		
		@ $mol_mem
		options() {
			return this.names_filtered().map( id => this.Option( id ) )
		}
		
		option_arg( id: string ) {
			return { 'demo' : id }
		}
		
		option_title( id: string ) {
			return '$'+ id.replace( '_demo_', '/' ).replace( '_demo', '' )
		}
		
	}
	
}
