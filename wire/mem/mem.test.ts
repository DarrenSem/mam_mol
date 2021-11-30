namespace $ {
	$mol_test({
		
		// https://github.com/nin-jin/slides/tree/master/reactivity#component-states
		'Cached channel' ($) {

			class App extends $mol_object2 {

				static $ = $
				
				@ $mol_wire_mem(0)
				static value( next = 1 ) { return next + 1 }

			}

			$mol_assert_equal( App.value() , 2 )

			App.value( 2 )
			$mol_assert_equal( App.value() , 3 )

		},

		// https://github.com/nin-jin/slides/tree/master/reactivity#wish--constant-consistency-of-states
		'Auto recalculation of cached values'( $ ) {
			
			class App extends $mol_object2 {

				static $ = $
				
				@ $mol_wire_mem(0)
				static xxx( next? : number ) {
					return next || 1
				}

				@ $mol_wire_mem(0)
				static yyy() {
					return this.xxx() + 1
				}

				@ $mol_wire_mem(0)
				static zzz() {
					return this.yyy() + 1
				}

			}
			
			$mol_assert_equal( App.yyy() , 2 )
			$mol_assert_equal( App.zzz() , 3 )

			App.xxx( 5 )
			$mol_assert_equal( App.zzz() , 7 )
			
		},

		// https://github.com/nin-jin/slides/tree/master/reactivity#wish--only-necessary-calculations
		'Skip recalculation when actually no dependency changes'( $ ) {
			
			const log = [] as string[]
			
			class App extends $mol_object2 {

				static $ = $
				
				@ $mol_wire_mem(0)
				static xxx( next? : number ) {
					log.push( 'xxx' )
					return next || 1
				}
				
				@ $mol_wire_mem(0)
				static yyy() {
					log.push( 'yyy' )
					return [ Math.sign( this.xxx() ) ]
				}
				
				@ $mol_wire_mem(0)
				static zzz() {
					log.push( 'zzz' )
					return this.yyy()[0] + 1
				}

			}
			
			App.zzz()
			$mol_assert_like( log , [ 'zzz', 'yyy', 'xxx' ] )
			
			App.xxx( 5 )
			App.zzz()
			$mol_assert_like( log , [ 'zzz', 'yyy', 'xxx', 'xxx', 'yyy' ] )
			
		},

		// https://github.com/nin-jin/slides/tree/master/reactivity#dupes-equality
		'Dupes: Equality'( $ ) {
			
			let counter = 0
			
			class App extends $mol_object2 {

				static $ = $
				
				@ $mol_wire_mem(0)
				static foo( next? : { numbs: number[] } ) {
					return next ?? { numbs: [ 1 ] }
				}

				@ $mol_wire_mem(0)
				static bar() {
					return { ... this.foo(), count: ++ counter }
				}

			}
			
			$mol_assert_like( App.bar() , { numbs: [ 1 ], count: 1 } )

			App.foo({ numbs: [ 1 ] })
			$mol_assert_like( App.bar() , { numbs: [ 1 ], count: 1 } )
			
			App.foo({ numbs: [ 2 ] })
			$mol_assert_like( App.bar() , { numbs: [ 2 ], count: 2 } )
			
		},

		// https://github.com/nin-jin/slides/tree/master/reactivity#cycle-fail
		'Cycle: Fail'( $ ) {
		
			class App extends $mol_object {
		
				static $ = $
				
				@ $mol_wire_mem(0)
				static foo() : number {
					return this.bar() + 1
				}
		
				@ $mol_wire_mem(0)
				static bar() : number {
					return this.foo() + 1
				}
		
			}
		
			$mol_assert_fail( ()=> App.foo(), 'Circular subscription' )

		} ,

		// https://github.com/nin-jin/slides/tree/master/reactivity#wish--stable-behavior
		'Different order of pull and push'( $ ) {
		
			class App extends $mol_object {
		
				static $ = $
				
				@ $mol_wire_mem(0)
				static store( next = 0 ) {
					return next
				}
		
				@ $mol_wire_mem(0)
				static fast( next?: number ) {
					return this.store( next )
				}
		
				@ $mol_wire_mem(0)
				static slow( next?: number ) {
					return this.store( next )
				}
		
			}
		
			App.fast()
			$mol_assert_equal( App.slow( 666 ) , 666 )
			$mol_assert_equal( App.fast(), App.slow(), 666 )
			
			App.store( 777 )
			$mol_assert_equal( App.fast(), App.slow(), 777 )

		} ,
		
		'Actions inside invariant'( $ ) {
		
			class App extends $mol_object {
		
				static $ = $
				
				@ $mol_wire_mem(0)
				static count( next = 0 ) {
					return next
				}
		
				@ $mol_wire_mem(0)
				static inc_event( next = null as null | Event ) {
					return next
				}
		
				@ $mol_wire_mem(0)
				static inc_task() {
					if( !this.inc_event() ) return
					this.count( this.count() + 1 )
					this.inc_event( null )
				}
		
				@ $mol_wire_mem(0)
				static res() {
					this.inc_task()
					return this.count()
				}
		
			}
			
			$mol_assert_like( App.res() , 0 )
			
			App.inc_event( new Event( 'inc' ) )
			$mol_assert_like( App.res() , 1 )
			
			App.inc_event( new Event( 'inc' ) )
			App.inc_event( new Event( 'inc' ) )
			$mol_assert_like( App.res() , 2 )
			
			App.count( 0 )
			$mol_assert_like( App.res() , 0 )
			
		} ,

	})
}
