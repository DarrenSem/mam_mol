namespace $ {

	export function $mol_build_start( paths : string[] ) {
		var build = $mol_build.relative( '.' )
		if( paths.length > 0 ) {
			try {
				process.argv.slice( 2 ).forEach(
					( path : string )=> {
						path = build.root().resolve( path ).path()
						return build.bundleAll( { path } )
					}
				)
				process.exit(0)
			} catch {
				process.exit(1)
			}
		} else {
			build.server().express()
		}
	}
	
	setTimeout( ()=> $mol_build_start( process.argv.slice( 2 ) ) )

	export class $mol_build extends $mol_object {
		
		@ $mol_mem_key
		static root( path : string ) {
			return this.make({
				root : $mol_const( $mol_file.absolute( path ) ) ,
			})
		}
		
		static relative( path : string ) {
			return $mol_build.root( $mol_file.relative( path ).path() )
		}
		
		@ $mol_mem
		server() {
			return $mol_build_server.make({
				build : $mol_const( this ) ,
			})
		}
		
		root() {
			return $mol_file.relative( '.' )
		}
		
		@ $mol_mem_key
		mods( { path , exclude } : { path : string , exclude? : string[] } ) {
			const mods : $mol_file[] = []
			
			$mol_file.absolute( path ).sub()
			.forEach(
				child => {
					const name = child.name()
					if( !/^[a-z0-9]/i.test( name ) ) return false
					if( exclude && RegExp( '[.=](' + exclude.join( '|' ) + ')[.]' , 'i' ).test( name ) ) return false
					
					if( /(meta\.tree)$/.test( name ) ) {

						const tree = $mol_tree.fromString( child.content().toString() , child.path() )

						let content = ''
						for( const step of tree.select( 'build' , '' ).sub ) {

							const res = $mol_exec( child.parent().path() , step.value ).stdout.toString().trim()
							if( step.type ) content += `let ${ step.type } = ${ JSON.stringify( res ) }`

						}

						if( content ) {
							const script = child.parent().resolve( `-meta.tree/${ child.name() }.ts` )
							script.content( content )
							mods.push( script )
						}

					} else if( /(view\.tree)$/.test( name ) ) {

						const script = child.parent().resolve( `-view.tree/${ child.name() }.ts` )
						const locale = child.parent().resolve( `-view.tree/${ child.name() }.locale=en.json` )
						
						const tree = $mol_tree.fromString( child.content().toString() , child.path() )
						const res = $mol_view_tree_compile( tree )
						script.content( res.script )
						locale.content( JSON.stringify( res.locales , null , '\t' ) )
						
						mods.push( script , locale )
					}

					mods.push( child )
					
					return true
				}
			)
			// .sort( ( a , b )=> a.path().length - b.path().length )
			
			return mods
		}
		
		@ $mol_mem_key
		modsRecursive( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			var mod = $mol_file.absolute( path )
			switch( mod.type() ) {
				case 'file' :
					return [ mod ]
				case 'dir' :
					var mods = [ mod ]
					for( var m of this.mods( { path , exclude } ) ) {
						if( m.type() !== 'dir' ) continue
						for( var dep of this.modsRecursive( { path : m.path() , exclude } ) ) {
							if( mods.indexOf( dep ) !== -1 ) continue
							mods.push( dep )
						}
					}
					return mods
				case null :
					throw new Error( `Module not found: "${mod.relate()}"` )
			}
			throw new Error( `Unsopported type "${mod.type()}" of "${mod.relate()}"` )
		}
		
		@ $mol_mem_key
		sources( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			const mod = $mol_file.absolute( path )
			switch( mod.type() ) {
				case 'file' :
					return [ mod ]
				case 'dir' :
					return this.mods( { path , exclude } ).filter( mod => mod.type() === 'file' )
				default:
					return []
			}
		}
		
		@ $mol_mem_key
		sourcesSorted( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			const mod = $mol_file.absolute( path )
			const graph = new $mol_graph< void , { priority : number } >()
			const sources = this.sources( { path , exclude } )
			for( let src of sources ) {
				graph.nodeEnsure( src.relate( this.root() ) )
			}
			for( let src of sources ) {
				let deps = this.srcDeps( src.path() )
				for( let p in deps ) {
					
					var names : string[]
					if( p[ 0 ] === '/' ) names = p.substring( 1 ).split( '/' )
					else if( p[ 0 ] === '.' ) names = mod.resolve( p ).relate( this.root() ).split( '/' )
					else names = [ 'node_modules' , ... p.split( '/' ) ]
					
					let files = [ this.root() ]
					for( let name of names ) {
						let nextFiles : $mol_file[] = []
						for( let file of files ) {
							let validName = new RegExp( `^(${file.name()})?${name}(?![a-z0-9])` , 'i' )
							for( let child of this.mods( { path : file.path() , exclude } ) ) {
								if( !child.name().match( validName ) ) continue
								nextFiles.push( child )
							}
						}
						if( nextFiles.length === 0 ) break
						files = nextFiles
					}
					
					for( let file of files ) {
						if( file === this.root() ) continue
						
							graph.link(
								src.relate( this.root() ) ,
								file.relate( this.root() ) ,
								{ priority : deps[ p ] }
							)
						}
					
				}
			}
			graph.cut_cycles( edge => edge.priority )
			
			let next = graph.sorted.map( name => this.root().resolve( name ) )
			return next
		}
		
		
		@ $mol_mem_key
		sourcesAll( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			const sortedPaths = this.graph( { path , exclude } ).sorted
			
			let sources : $mol_file[] = []
			sortedPaths.forEach( path => {
				this.sourcesSorted( { path : this.root().resolve( path ).path() , exclude } ).forEach( src => {
					if( sources.indexOf( src ) === -1 ) sources.push( src )
				} )
			} )
			
			return sources
		}
		
		@ $mol_mem
		tsOptions() {
			const rawOptions = JSON.parse( this.root().resolve( 'tsconfig.json' ).content() + '').compilerOptions
			const res = $node.typescript.convertCompilerOptionsFromJson( rawOptions , "." , 'tsconfig.json' )
			if( res.errors.length ) throw res.errors
			return res.options
		}
		
		@ $mol_mem_key
		tsSource( { path , target } : { path : string , target : number } ) {
			const content = $mol_file.absolute( path ).content().toString()
			return $node.typescript.createSourceFile( path , content , target )
		}

		@ $mol_mem_key
		tsPaths( { path , exclude , bundle } : { path : string , bundle : string , exclude : string[] } ) {

			const sources = this.sourcesAll( { path , exclude } ).filter( src => /tsx?$/.test( src.ext() ) )

			if( sources.length && bundle === 'node' ) {
				const types = [] as string[]
				
				for( let dep of this.nodeDeps({ path , exclude }) ) {
					types.push( '\t' + JSON.stringify( dep ) + ' : typeof import( ' + JSON.stringify( dep ) + ' )' )
				}
				
				const node_types = $mol_file.absolute( path ).resolve( `-node/deps.d.ts` )
				node_types.content( 'interface $node {\n ' + types.join( '\n' ) + '\n}' )
				sources.push( node_types )
			}

			return sources.map( src => src.path() )
		}
		
		@ $mol_mem_key
		tsCompile( { path , exclude , bundle } : { path : string , bundle : string , exclude : string[] } ) {

			const paths = this.tsPaths({ path , exclude , bundle })
			if( !paths.length ) return null

			var host = $node.typescript.createWatchCompilerHost(

				paths ,
				
				this.tsOptions(),
				
				{
					... $node.typescript.sys ,
					setTimeout : ( cb : any )=> cb(),
					writeFile : ( path : string , content : string )=> {
						$mol_file.relative( path ).content( content , $mol_atom_force_cache )
					} ,
				},
				
				$node.typescript.createEmitAndSemanticDiagnosticsBuilderProgram,

				( diagnostic : any )=> {

					if( diagnostic.file ) {

						const file = $mol_file.absolute( diagnostic.file.fileName.replace( /\.tsx?$/ , '.js' ) )
						
						const error = new Error( $node.typescript.formatDiagnostic( diagnostic , {
							getCurrentDirectory : ()=> this.root().path() ,
							getCanonicalFileName : ( path : string )=> path.toLowerCase() ,
							getNewLine : ()=> '\n' ,
						}) )
						
						file.content( error as any , $mol_atom_force_cache )
						
					} else {
						
						console.error( diagnostic.messageText )

					}
					
				} ,

				() => {} ,
				
			)

			const builder = $node.typescript.createWatchProgram( host )

			return $mol_object.make({ destructor : ()=> { builder.updateRootFileNames([]) } })

		}
		
		@ $mol_mem_key
		sourcesJS( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {

			var sources = this.sourcesAll( { path , exclude } )
			.filter( src => /(js|tsx?)$/.test( src.ext() ) )
			if( !sources.length ) return []
			
			sources = sources.map(
				src => {
					if( !/tsx?$/.test( src.ext() ) ) return src
					
					return src.parent().resolve( src.name().replace( /\.tsx?$/ , '.js' ) )
				}
			)
			
			return sources
		}
		
		@ $mol_mem_key
		sourcesDTS( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			
			let sources = this.sourcesAll( { path , exclude } )
			
			sources = sources.filter( src => /(tsx?)$/.test( src.ext() ) )
			
			sources = sources.map(
				src => src.parent().resolve( src.name().replace( /(\.d)?\.tsx?$/ , '.d.ts' ) )
			)
			
			return sources
		}
		
		@ $mol_mem_key
		sourcesCSS( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			return this.sourcesAll( { path , exclude } ).filter( src => /(css)$/.test( src.ext() ) )
		}
		
		static dependors : { [ index : string ] : ( source : $mol_file )=> { [ index : string ] : number } } = {}
		
		@ $mol_mem_key
		srcDeps( path : string ) {
			const src = $mol_file.absolute( path )
			
			let ext = src.ext()
			if( !ext ) return {}
			
			let dependencies 
			while( !dependencies ) {
				dependencies = $mol_build.dependors[ ext ]
				if( dependencies ) break
				var extShort = ext.replace( /^[^.]*\./ , '' )
				if( ext === extShort ) break
				ext = extShort
			}
			
			return dependencies ? dependencies( src ) : {}
		}
		
		@ $mol_mem_key
		modDeps( { path , exclude } : { path : string , exclude? : string[] } ) {
			const mod = $mol_file.absolute( path )
			const depends : { [ index : string ] : number } = { '..' : Number.MIN_SAFE_INTEGER }
			for( var src of this.sources( { path , exclude } ) ) {
				$mol_build_depsMerge( depends , this.srcDeps( src.path() ) )
			}
			return depends
		}
		
		@ $mol_mem_key
		dependencies( { path , exclude } : { path : string , exclude? : string[] } ) {
			var mod = $mol_file.absolute( path )
			switch( mod.type() ) {
				case 'file' :
					return this.srcDeps( path )
				case 'dir' :
					return this.modDeps( { path , exclude } )
				default :
					return {}
			}
		}
		
		@ $mol_mem_key
		modEnsure( path : string ) {

			// Prevent automatic state clear on every bundle build
			$mol_atom_current().destructor = ()=> {}

			var mod = $mol_file.absolute( path )
			if( mod === this.root() ) return false

			var parent = mod.parent()
			this.modEnsure( parent.path() )
			
			var mapping = this.modMeta( parent.path() )
			
			if( mod.exists() ) {
				if( mod.type() === 'dir' && mod.resolve( '.git' ).type() === 'dir' ) {
					try {
						//$mol_exec( pack.path() , 'git' , '--no-pager' , 'fetch' )
						process.stdout.write( $mol_exec( mod.path() , 'git' , '--no-pager' , 'log' , '--oneline' , 'HEAD..origin/master' ).stdout )
					} catch( error ) {
						console.error( error.message )
					}
				}
				return false
			}

			for( let repo of mapping.select( 'pack' , mod.name() , 'git' ).sub ) {
				console.log( '> git clone' , repo.value , mod.path() )
				$mol_exec( this.root().path() , 'git' , 'clone' , repo.value , mod.path() )
				mod.stat( undefined , $mol_atom_force_cache )
				return true
			}
			
			if( parent === this.root() ) {
				throw new Error( `Root package "${ mod.relate( this.root() ) }" not found` )
			}

			return false
		}
		
		@ $mol_mem_key
		modMeta( path : string ) {

			const decls = [] as $mol_tree[]

			const pack = $mol_file.absolute( path )
			for( const file of pack.sub() ) {
				if( !/\.meta\.tree$/.test( file.name() ) ) continue
				decls.push( ... $mol_tree.fromString( file.content().toString() , file.path() ).sub )
			}
			
			return new $mol_tree({ sub : decls })

		}
		
		@ $mol_mem_key
		graph( { path , exclude } : { path : string , exclude? : string[] } ) {
			let graph = new $mol_graph< null , { priority : number } >()
			let added : { [ path : string ] : boolean } = {}
			
			var addMod = ( mod : $mol_file )=> {
				if( added[ mod.path() ] ) return
				added[ mod.path() ] = true
				
				graph.nodes[ mod.relate( this.root() ) ] = null
				
				const checkDep = ( p : string )=> {
					
					var dep = ( p[ 0 ] === '/' )
					? this.root().resolve( p )
					: ( p[ 0 ] === '.' )
					? mod.resolve( p )
					: this.root().resolve( 'node_modules' ).resolve( './' + p )

					try {
						this.modEnsure( dep.path() )
					} catch( error ) {
						throw new Error( `${ error.message }\nDependency "${ dep.relate( this.root() ) }" from "${ mod.relate( this.root() ) }" ` )
					}
					
					while( !dep.exists() ) dep = dep.parent()
					
					if( dep.type() === 'dir' ) {
						let index = dep.resolve( 'index.js' )
						if( index.exists() ) dep = index
					}
					
					//if( dep.type() === 'file' ) dep = dep.parent()
					if( mod === dep ) return
					if( dep === this.root() ) return
					
					const from = mod.relate( this.root() )
					const to = dep.relate( this.root() )
					const edge = graph.edgesOut[ from ] && graph.edgesOut[ from ][ to ]
					if( !edge || ( deps[ p ] > edge.priority ) ) {
						graph.link( from , to , { priority : deps[ p ] } )
					}
					
					addMod( dep )
				}
				
				let deps = this.dependencies( { path : mod.path() , exclude } )
				for( let p in deps ) {
					checkDep( p )
				}
				
			}
			
			this.modEnsure( path )

			addMod( $mol_file.absolute( path ) )
			
			graph.cut_cycles( edge => edge.priority )

			return graph
		}

		bundleAll( { path } : { path : string } ) {

			const once = ( action : ()=> void )=> {
				const task = new $mol_atom( '$mol_build_start' , action )
				task.value()
				task.destructor()
				$mol_atom.sync()
			}

			once( ()=> {
				this.bundle({ path , bundle : 'web.deps.json' })
				this.bundle({ path , bundle : 'web.css' })
				this.bundle({ path , bundle : 'web.js' })
				this.bundle({ path , bundle : 'web.test.js' })
				this.bundle({ path , bundle : 'web.test.html' })
				this.bundle({ path , bundle : 'web.d.ts' })
				this.bundle({ path , bundle : 'web.view.tree' })
				this.bundle({ path , bundle : 'web.locale=en.json' })
			} )

			once( ()=> {
				this.bundle({ path , bundle : 'node.deps.json' })
				this.bundle({ path , bundle : 'node.js' })
				this.bundle({ path , bundle : 'node.test.js' })
				this.bundle({ path , bundle : 'node.d.ts' })
				this.bundle({ path , bundle : 'node.view.tree' })
				this.bundle({ path , bundle : 'node.locale=en.json' })
			} )

			this.bundle({ path , bundle : 'package.json' })

			this.bundleFiles( { path , exclude : [ 'node' ] } )
			this.bundleCordova( { path , exclude : [ 'node' ] } )

		}
		
		bundle( { path , bundle = '' } : { path : string , bundle? : string } ) {
			
			bundle = bundle && bundle.replace( /\.map$/ , '' )
			
			var envsDef = [ 'web' , 'node' ]
			var envs = bundle ? [] as string[] : envsDef.slice()
			var stages = [ 'test' , 'dev' ]
			var moduleTargets = ['', 'esm']
			if( bundle ) {
				
				var [ bundle , tags , type , locale ] = /^(.*?)(?:\.(test\.js|test\.html|js|css|deps\.json|locale=(\w+)\.json))?$/.exec(
					bundle
				)!
				
				tags.split( '.' ).forEach(
					tag => {
						if( envsDef.indexOf( tag ) !== -1 ) envs = [ tag ]
					}
				)
			}
			
			var res : $mol_file[] = []
			
			envs.forEach(
				env => {
					var exclude = envsDef.filter( e => e !== env ).concat( stages )
					
					if( !type || type === 'deps.json' ) {
						res = res.concat( this.bundleDepsJSON( { path , exclude , bundle : env } ) )
					}
					if( !type || type === 'css' ) {
						res = res.concat( this.bundleCSS( { path , exclude , bundle : env } ) )
					}
					if( !type || type === 'js' ) {
						moduleTargets.forEach(
							moduleTarget => {
								res = res.concat( this.bundleJS( { path , exclude , bundle : env, moduleTarget } ) )
							}
						)
					}
					if( !type || type === 'test.js' ) {
						res = res.concat( this.bundleTestJS( { path , exclude , bundle : env } ) )
					}
					if( !type || type === 'test.html' ) {
						res = res.concat( this.bundleTestHtml({ path }) )
					}
					if( !type || type === 'd.ts' ) {
						res = res.concat( this.bundleDTS( { path , exclude , bundle : env } ) )
					}
					if( !type || type === 'view.tree' ) {
						res = res.concat( this.bundleViewTree( { path , exclude , bundle : env } ) )
					}
					if( !type || /^locale=(\w+).json$/.test( type ) ) {
						res = res.concat(
							this.bundleLocale(
								{
									path ,
									exclude ,
									bundle : env
								}
							)
						)
					}
				}
			)
			
			if( !bundle || bundle === 'package.json' ) {
				res = res.concat( this.bundlePackageJSON( { path , exclude : [ 'web' ] } ) )
			}
			
			return res.map( r => r.valueOf() )
		}
		
		logBundle( target : $mol_file ) {
			var time = new Date().toLocaleTimeString()
			var path = target.relate( this.root() )
			console.log( `${time} Built ${path}` )
		}
		
		@ $mol_mem_key
		bundleJS( { path , exclude , bundle , moduleTarget } : { path : string , exclude : string[] , bundle : string, moduleTarget? : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			var mt = moduleTarget ? `.${moduleTarget}` : ''
			var target = pack.resolve( `-/${bundle}${mt}.js` )
			var targetMap = pack.resolve( `-/${bundle}${mt}.js.map` )
			
			var sources = this.sourcesJS( { path , exclude } )
			if( sources.length === 0 ) return []
			
			this.tsCompile({ path , exclude , bundle })
			
			var concater = new $mol_sourcemap_builder( target.name(), ';')

			if( bundle === 'node' ) {
				concater.add( 'require'+'( "source-map-support" ).install(); var exports = void 0;\n' )
				concater.add( "process.on( 'unhandledRejection' , up => { throw up } )" )
			} else {
				concater.add( 'function require'+'( path ){ return $node[ path ] }' )
			}

			const errors = [] as Error[]
			sources.forEach(
				( src )=> {
					if( bundle === 'node' ) {
						if( /node_modules\//.test( src.relate( this.root() ) ) ) {
							return
						}
					}
					try {
						const content = ( src.content() || '' ).toString().replace( /^\/\/#\ssourceMappingURL=/mg , '//' )+'\n'
						const isCommonJs = /module\.exports/.test( content )
					
						if( isCommonJs ) {
							concater.add( `\nvar $node = $node || {}\nvoid function( module ) { var exports = module.${''}exports = this; function require( id ) { return $node[ id.replace( /^.\\// , "' + src.parent().relate( this.root().resolve( 'node_modules' ) ) + '/" ) + ".js" ] }; \n`, '-' )
						}
	
						const srcMap = src.parent().resolve( src.name() + '.map' ).content()
						if(content) concater.add( content, src.relate( target.parent() ), srcMap + '')
						
						if( isCommonJs ) {
							const idFull = src.relate( this.root().resolve( 'node_modules' ) )
							const idShort = idFull.replace( /\/index\.js$/ , '' )
							concater.add( `\n$${''}node[ "${ idShort }" ] = $${''}node[ "${ idFull }" ] = module.${''}exports }.call( {} , {} )\n`, '-' )
						}
					} catch( error ) {
						errors.push( error )
					}
				}
			)
			if( moduleTarget === 'esm' ) {
				concater.add( 'export default $', '-' )
			}
			target.content( concater.content + '\n//# sourceMappingURL=' + targetMap.relate( target.parent() )+'\n' )
			targetMap.content( concater.toString() )
			
			this.logBundle( target )

			if( errors.length ) $mol_fail_hidden( new Error( errors.map( error => error.message ).join( '\n' ) ) )
			
			return [ target , targetMap ]
		}
		
		@ $mol_mem_key
		bundleTestJS( { path , exclude , bundle } : { path : string , exclude : string[] , bundle : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var root = this.root()
			var target = pack.resolve( `-/${bundle}.test.js` )
			var targetMap = pack.resolve( `-/${bundle}.test.js.map` )
			
			var concater = new $mol_sourcemap_builder( target.name(), ';')
			
			var exclude_ext = exclude.filter( ex => ex !== 'test' && ex !== 'dev' )
			var sources = this.sourcesJS( { path , exclude : exclude_ext } )
			var sourcesNoTest = this.sourcesJS( { path , exclude } )
			var sourcesTest = sources.filter( src => sourcesNoTest.indexOf( src ) === -1 )
			if( bundle === 'node' ) {
				concater.add( 'require'+'( "source-map-support" ).install()\n' )
				concater.add( "process.on( 'unhandledRejection' , up => { throw up } )" )
				sources = [ ... sourcesNoTest , ... sourcesTest ]
			} else {
				concater.add( 'function require'+'( path ){ return $node[ path ] }' )
				sources = sourcesTest
			}
			if( sources.length === 0 ) return []
			
			this.tsCompile({ path , exclude : exclude_ext , bundle })
			
			const errors = [] as Error[]
			
			sources.forEach(
				function( src ) {
					if( bundle === 'node' ) {
						if( /node_modules\//.test( src.relate( root ) ) ) {
							return
						}
					}
					let content = ''					
					try {
						content = ( src.content() || '' ).toString().replace( /^\/\/#\ssourceMappingURL=/mg , '//' )+'\n'
						const srcMap = src.parent().resolve( src.name() + '.map' ).content()
						if(content) concater.add( content, src.relate( target.parent() ), srcMap + '')
						} catch( error ) {
						errors.push( error )
					}
				}
			)
			
			target.content( concater.content + '\n//# sourceMappingURL=' + targetMap.relate( target.parent() )+'\n' )
			targetMap.content( concater.toString() )
			
			this.logBundle( target )
			
			if( errors.length ) $mol_fail_hidden( new Error( errors.map( error => error.message ).join( '\n' ) ) )
			
			return [ target , targetMap ]
		}
		
		@ $mol_mem_key
		bundleTestHtml( { path } : { path : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var source = pack.resolve( `index.html` )
			var target = pack.resolve( `-/web.test.html` )

			const content = `
<!doctype html>
<meta charset="utf-8" />
<body>
<script src="web.js" charset="utf-8"></script>
<script>
	addEventListener( 'load' , function() {
		var script = document.createElement( 'script' )
		script.src = 'web.test.js'
		document.body.appendChild( script )
	} )
</script>
`
			
			target.content( content )
			
			this.logBundle( target )
			
			return [ target ]
		}

		@ $mol_mem_key
		bundleDTS( { path , exclude , bundle } : { path : string , exclude? : string[] , bundle : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var target = pack.resolve( `-/${bundle}.d.ts` )
			
			var sources = this.sourcesDTS( { path , exclude } )
			if( sources.length === 0 ) return []
			
			var concater = new $mol_sourcemap_builder( target.name() )
			
			sources.forEach(
				function( src ) {
					if( !src.content() ) return
					concater.add( src.content().toString(), src.relate( target.parent() ) )
				}
			)
			
			target.content( concater.content )
			
			this.logBundle( target )
			
			return [ target ]
		}
		
		@ $mol_mem_key
		bundleViewTree( { path , exclude , bundle } : { path : string , exclude? : string[] , bundle : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var target = pack.resolve( `-/${bundle}.view.tree` )
			
			var sources = this.sourcesAll({ path , exclude })
			.filter( src => /view.tree$/.test( src.ext() ) )
			
			if( sources.length === 0 ) return []
			
			target.content( sources.map( src => src.content().toString() ).join( '\n' ) )
			
			this.logBundle( target )
			
			return [ target ]
		}

		@ $mol_mem_key
		nodeDeps( { path , exclude } : { path : string , exclude : string[] } ) : string[] {
			
			var res = new Set<string>()
			var sources = this.sourcesAll( { path , exclude } )
			
			for( let src of sources ) {
				let deps = this.srcDeps( src.path() )
				for( let dep in deps ) {
					if( !/^\/node(?:_modules)?\//.test( dep ) ) continue
					let mod = dep.replace( /^\/node(?:_modules)?\// , '' ).replace( /\/.*/g , '' )
					res.add( mod )
				}
			}

			return [ ... res ]

		}

		@ $mol_mem_key
		bundlePackageJSON( { path , exclude } : { path : string , exclude : string[] } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var target = pack.resolve( `-/package.json` )
			
			exclude = exclude.filter( ex => ex !== 'test' && ex !== 'dev' )
			var sources = this.sourcesAll( { path , exclude } )
			
			var json : any
			try {
				$mol_atom_fence( ()=> json = target.exists() && JSON.parse( target.content().toString() ) )
			} catch( error ) {
				console.error( error )
			}

			if( !json ) json = {
				name : pack.relate( this.root() ).replace( /\//g , '_' ) ,
				version : '0.0.0' ,
				main : 'node.js' ,
				module : 'node.esm.js',
				browser : 'web.esm.js',
				types : 'web.d.ts',
				dependencies : <{ [ key : string ] : string }>{}
			}

			json.version = json.version.replace( /\d+$/, ( build : string )=> parseInt( build ) + 1 )
			json.dependencies = {}
			
			for( let dep of this.nodeDeps({ path , exclude }) ) {
				if( require('module').builtinModules.includes(dep) ) continue
				json.dependencies[ dep ] = `*`
			}
			
			target.content( JSON.stringify( json , null , '  ' ) )
			
			this.logBundle( target )
			
			return [ target ]
		}
		
		@ $mol_mem_key
		bundleFiles( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			const root = this.root()
			const pack = $mol_file.absolute( path )
			
			var sources = this.sourcesAll( { path , exclude } )
			.filter( src => /meta.tree$/.test( src.ext() ) )
			
			const targets : $mol_file[] = []

			const html = pack.resolve( 'index.html' )
			const html_target = pack.resolve( '-/index.html' )
			html_target.content( html.content() )
			targets.push( html_target )
			this.logBundle( html_target )

			sources.forEach( source => {
				const tree = $mol_tree.fromString( source.content().toString() , source.path() )
				
				tree.select( 'deploy' ).sub.forEach( deploy => {
					const file = root.resolve( deploy.value.replace( /^\// , '' ) )
					const target = pack.resolve( `-/${ file.relate( root ) }` )
					target.content( file.content() )
					targets.push( target )
					this.logBundle( target )
				} )
				
			} )
			
			return targets
		}
		
		@ $mol_mem_key
		bundleCordova( { path , exclude } : { path : string , exclude? : string[] } ) : $mol_file[] {
			const pack = $mol_file.absolute( path )
			const cordova = pack.resolve( '-cordova' )
			
			const config = pack.resolve( 'config.xml' )
			if( !config.exists() ) return []
			
			const config_target = cordova.resolve( 'config.xml' )
			config_target.content( config.content() )
			
			const html = pack.resolve( 'index.html' )
			const html_target = cordova.resolve( 'www/index.html' )
			html_target.content( html.content() )
			
			const sources = pack.resolve( '-' ).find().filter( src => src.type() === 'file' )
			
			const targets = [ config_target , html_target ]
			.concat( sources.map( source => {
				const target = cordova.resolve( `www/${ source.relate( pack ) }` )
				target.content( source.content() )
				return target
			} ) )
			
			this.logBundle( cordova )
			
			return targets
		}
		
		@ $mol_mem_key
		bundleCSS( { path , exclude , bundle } : { path : string , exclude? : string[] , bundle : string } ) : $mol_file[] {
			if( bundle === 'node' ) return []
			
			var pack = $mol_file.absolute( path )
			var sources = this.sourcesCSS( { path , exclude } )
			if( !sources.length ) return []
			
			var target = pack.resolve( `-/${bundle}.css` )
			var targetMap = pack.resolve( `-/${bundle}.css.map` )
			
			var root : any = null //$node['postcss'].root({})
			sources.forEach(
				src => {
					var root2 = $node['postcss'].parse( src.content() , { from : src.path() } )
					root = root ? root.append( root2 ) : root2
				}
			)
			
			var processor = $node['postcss']([
				$node[ 'postcss-custom-properties' ]({
					preserve : true ,
				}) ,
				$node[ 'postcss-color-function' ]() ,
			])
			var result = processor.process( root , { to : target.relate() , map : { inline : false } } )
			
			target.content( result.css )
			targetMap.content( JSON.stringify( result.map , null , '\t' ) )
			
			this.logBundle( target )
			
			return [ target , targetMap ]
		}
		
		@ $mol_mem_key
		bundleLocale( { path , exclude , bundle } : { path : string , exclude? : string[] , bundle : string } ) : $mol_file[] {
			const pack = $mol_file.absolute( path )
			
			const sources = this.sourcesAll( { path , exclude } ).filter( src => /(locale=(\w+)\.json)$/.test( src.name() ) )
			if( !sources.length ) return []
			
			const locales = {} as { [ key : string ] : { [ key : string ] : string } }
			
			sources.forEach(
				src => {
					const [ ext , lang ] = /locale=(\w+)\.json$/.exec( src.name() )!
					
					if( !locales[ lang ] ) locales[ lang ] = {}
					
					const loc = JSON.parse( src.content().toString() )
					for( let key in loc ) {
						locales[ lang ][ key ] = loc[ key ]
					}
				}
			)
			
			const targets = Object.keys( locales ).map( lang => {
				const target = pack.resolve( `-/${bundle}.locale=${ lang }.json` )
				
				const locale = locales[ lang ]

				if( lang !== 'en' && locales['en'] ) {
					
					for( let key in locale ) {
						if( key in locales[ 'en' ] ) continue
						console.warn( `Not translated to "en": ${ key }` )
					}

				}
				
				const locale_sorted = {}

				for( let key of Object.keys( locale ).sort() ) {
					locale_sorted[ key ] = locale[ key ]
				}

				target.content( JSON.stringify( locale_sorted , null , '\t' ) )
				
				this.logBundle( target )
				
				return target
			} )
			
			return targets
		}
		
		@ $mol_mem_key
		bundleDepsJSON( { path , exclude , bundle } : { path : string , exclude? : string[] , bundle : string } ) : $mol_file[] {
			var pack = $mol_file.absolute( path )
			
			var list = this.sourcesAll( { path , exclude } )
			if( !list.length ) return []
			
			var graph = this.graph( { path , exclude } )
			
			var deps : any = {}
			for( let dep in graph.nodes ) {
				deps[ dep ] = this.dependencies( { path : this.root().resolve( dep ).path() , exclude } )
			}
			
			var data = {
				files : list.map( src => src.relate( this.root() ) ) ,
				edgesIn : graph.edgesIn ,
				edgesOut : graph.edgesOut ,
				deps
			}
			
			var target = pack.resolve( `-/${bundle}.deps.json` )
			target.content( JSON.stringify( data ) )
			
			this.logBundle( target )
			
			return [ target ]
		}
	}
	
	function $mol_build_depsMerge(
		target : { [ index : string ] : number } ,
		source : { [ index : string ] : number }
	) : { [ index : string ] : number } {
		for( var path in source ) {
			if( target[ path ] >= source[ path ] ) continue
			target[ path ] = source[ path ]
		}
		return target
	}
	
	$mol_build.dependors[ 'js' ] = source => {
		var depends : { [ index : string ] : number } = {}
		
		var lines = String( source.content() )
		.replace( /\/\*[^]*?\*\//g , '' ) // drop block comments
		.replace( /\/\/.*$/gm , '' ) // drop inline comments
		.split( '\n' )
		
		lines.forEach(
			function( line ) {
				var indent = /^([\s\t]*)/.exec( line )!
				var priority = -indent[ 0 ].replace( /\t/g , '    ' ).length / 4
				
				line.replace(
					/require\(\s*['"](.*?)['"]\s*\)/ig , ( str , path )=> {
						if( !/\.[^\/]$/.test( path ) ) path += '.js'
						if( path[0] === '.' ) path = '../' + path
						$mol_build_depsMerge( depends , { [ path ] : priority } )
						return str
					}
				)
			}
		)
		
		return depends
	}
	
	$mol_build.dependors[ 'ts' ] = $mol_build.dependors[ 'tsx' ] = $mol_build.dependors[ 'jam.js' ] = source => {
		var depends : { [ index : string ] : number } = {}
		
		var lines = String( source.content() )
		.replace( /\/\*(?!\*)[\s\S]*?\*\//g , '' ) // drop block comments except doc-comments
		.replace( /\/\/.*$/gm , '' ) // drop inline comments
		.split( '\n' )
		
		lines.forEach(
			function( line ) {
				var indent = /^([\s\t]*)/.exec( line )!
				var priority = -indent[ 0 ].replace( /\t/g , '    ' ).length / 4
				
				line.replace(
					/\$([a-z0-9]{2,})(?:((?:[._A-Z0-9][a-z0-9]+)+)|\[\s*['"]([^'"]+?)['"]\s*\])?/g , ( str , pack , path , name )=> {
						if( path ) path = '/' + pack + path.replace( /(?=[A-Z])/g , '_' ).toLowerCase().replace( /[_.\[\]'"]+/g , '/' )
						if( name ) name = '/' + pack + '/' + name
						pack = '/' + pack
						$mol_build_depsMerge( depends , { [ path || name || pack ] : priority } )
						return str
					}
				)
				
				
				line.replace(
					/require\(\s*['"](.*?)['"]\s*\)/ig , ( str , path )=> {
						$mol_build_depsMerge( depends , { [ path ] : priority } )
						return str
					}
				)
			}
		)
		
		return depends
	}
	
	$mol_build.dependors[ 'view.ts' ] = source => {
		var treeName = './' + source.name().replace( /ts$/ , 'tree' )
		var depends : { [ index : string ] : number } = { [ treeName ] : 0 }
		$mol_build_depsMerge( depends , $mol_build.dependors[ 'ts' ]( source ) )
		return depends
	}
	
	$mol_build.dependors[ 'css' ] = $mol_build.dependors[ 'view.css' ] = source => {
		var depends : { [ index : string ] : number } = {}
		
		var lines = String( source.content() )
		.replace( /\/\*[^]*?\*\//g , '' ) // drop block comments
		.replace( /\/\/.*$/gm , '' ) // drop inline comments
		.split( '\n' )
		
		lines.forEach(
			function( line ) {
				var indent = /^([\s\t]*)/.exec( line )!
				var priority = -indent[ 0 ].replace( /\t/g , '    ' ).length / 4
				
				line.replace(
					/(?:--|[\[\.#])([a-z][a-z0-9]+(?:[-_][a-z0-9]+)+)/ig , ( str , name )=> {
						$mol_build_depsMerge( depends , { [ '/' + name.replace( /[._-]/g , '/' ) ] : priority } )
						return str
					}
				)
			}
		)
		
		return depends
	}
	
	$mol_build.dependors[ 'meta.tree' ] = source => {
		const depends : { [ index : string ] : number } = {}
		
		const tree = $mol_tree.fromString( source.content().toString() , source.path() )
		
		tree.select( 'require' ).sub.forEach( leaf => {
			depends[ leaf.value ] = 0
		} )
		
		tree.select( 'include' ).sub.forEach( leaf => {
			depends[ leaf.value ] = Number.MIN_SAFE_INTEGER
		} )
		
		return depends
	}
	
}
