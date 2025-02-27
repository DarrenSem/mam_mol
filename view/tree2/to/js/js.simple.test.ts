namespace $ {

	const run = $mol_view_tree2_to_js_test_run

	$mol_test({
		
		'Empty class'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
			`)
			
			Foo.make({ $ })
			
		},
		
		'Mutable and read only channels'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
					readonly null
					mutable? null
			`)
			
			const foo = Foo.make({ $ })
			
			$mol_assert_like(
				foo.readonly(),
				foo.readonly( 1 ),
				foo.readonly(),
				null,
			)
			
			$mol_assert_like(
				foo.mutable(),
				null,
			)
				
			$mol_assert_like(
				foo.mutable(2),
				foo.mutable(),
				2,
			)
			
		},
		
		'Boolean channel array'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
					bar /
						false
						true
			`)
			
			$mol_assert_like(
				Foo.make({ $ }).bar(),
				[ false, true ],
			)
			
		},
		
		'Number channel array'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
					bar /
						- NaN
						-Infinity
						+Infinity
						0
			`)
			
			$mol_assert_like(
				Foo.make({ $ }).bar(),
				[
					// Number.NaN,
					Number.NEGATIVE_INFINITY,
					Number.POSITIVE_INFINITY,
					0,
				],
			)
			
		},
		
		'String channel'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
					hardcoded \\
						\\First
						\\Second
					localized @ \\
			`)
			
			$mol_assert_like(
				Foo.make({ $ }).hardcoded(),
				'First\nSecond',
			)
			
			$mol_assert_like(
				Foo.make({ $ }).localized(),
				'<Foo_localized>',
			)
			
		},
		
		'default indexed channel'( $ ) {
			
			const { Foo } = run(`
				Foo $mol_object
					a*? null
			`)

			const foo = Foo.make({ $ })

			$mol_assert_like(
				foo.a(0, 1),
				foo.a(0),
				1
			)
			
		},

		'empty legacy indexed channel throws error'( $ ) {
			$mol_assert_fail(() => {
				run(`
					Foo $mol_object
						a!? null
				`)
			})

			$mol_assert_fail(() => {
				run(`
					Foo $mol_object
						b! 1
				`)
			})
		},

		'two classes'( $ ) {
			const { A2, B2 } = run(`
				A2 $mol_object
					str \\some
				
				B2 A2
					str \\some2
			`)
			const a = A2.make( { $ })
			const b = B2.make( { $ })

			$mol_assert_ok(b instanceof A2)
			$mol_assert_ok(b instanceof B2)

			$mol_assert_like( a.str(), 'some')
			$mol_assert_like( b.str(), 'some2')
		},

		'commented node'( $ ) {
			const { A2, B2 } = run(`
				A2 $mol_object
					str \\some
				- B2 A2
					str \\some2
			`)

			const a = A2.make( { $ })
			$mol_assert_ok(a instanceof A2)
			$mol_assert_ok(B2 === undefined)
		},

		'factory props'( $ ) {
			const { Foo } = run(`
				Foo $mol_object
					button $mol_object
						some true
						sub /
							1
			`)

			const foo = Foo.make({ $ })

			$mol_assert_ok(typeof foo.button().sub === 'function')

			$mol_assert_ok(typeof foo.button().some === 'function')

			$mol_assert_like(
				foo.button().sub()[0],
				1
			)
		},

	})
	
}
