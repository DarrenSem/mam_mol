namespace $ {

	export const enum $mol_fiber_status {
		persist = -3 , // 🗹
		actual = -2 , // ✔
		doubt = -1 , // �
		obsolete = 0 , // ✘
	}

	export function $mol_fiber_defer< Value = void >( calculate : ()=> Value ) {
		
		const fiber = new $mol_fiber
		
		fiber.calculate = calculate
		fiber[ Symbol.toStringTag ] = calculate.name
		
		fiber.schedule()
		
		return fiber
	}

	export function $mol_fiber_func<
		This ,
		Args extends any[] ,
		Result ,
	>( calculate : ( this : This , ... args : Args )=> Result ) {
		console.warn( '$mol_fiber_func is deprecated. Use $mol_fiber.func instead.' )
		return $mol_fiber.func( calculate )
	}

	export function $mol_fiber_root<
		Calculate extends ( this : This , ... args : any[] )=> Result ,
		Result = void ,
		This = void ,
	>( calculate : Calculate ) {
		
		const wrapper = function( ... args : any[] ) {
			const fiber = new $mol_fiber< Result >()
			fiber.calculate = calculate.bind( this , ... args )
			return fiber.wake()
		} as Calculate
		
		wrapper[ Symbol.toStringTag ] = calculate.name
		
		return wrapper
	}

	export function $mol_fiber_method< Host , Value >(
		obj : Host ,
		name : keyof Host ,
		descr : TypedPropertyDescriptor< ( this : Host , ... args : any[] )=> Value >
	) {
		console.warn( '$mol_fiber_method is deprecated. Use $mol_fiber.method instead.' )
		return $mol_fiber.method( obj , name , descr )
	}

	export function $mol_fiber_sync< Args extends any[] , Value = void , This = void >(
		request : ( this : This , ... args : Args )=> PromiseLike< Value >
	) : ( ... args : Args )=> Value {

		return function $mol_fiber_sync_wrapper( this : This , ... args : Args ) {

			const slave = $mol_fiber.current

			let master = slave && slave.master
			if( !master || master.constructor !== $mol_fiber ) {
				master = new $mol_fiber
				master.cursor = $mol_fiber_status.persist
				master.error = ( request.call( this , ... args ) as PromiseLike< Value > ).then(
					res => master!.push( res ) ,
					err => master!.fail( err ) ,
				)
				const prefix = slave ? `${ slave }/${ slave.cursor / 2 }:` : '/'
				master[ Symbol.toStringTag ] = prefix + ( request.name || $mol_fiber_sync.name )
			}

			return master.get()

		}

	}

	export async function $mol_fiber_warp() {
		const deadline = $mol_fiber.deadline
		try {
			$mol_fiber.deadline = Number.POSITIVE_INFINITY
			while( $mol_fiber.queue.length ) await $mol_fiber.tick()
			return Promise.resolve()
		} finally {
			$mol_fiber.deadline = deadline
		}
	}

	export function $mol_fiber_fence( func : ()=> any ) {
		const prev = $mol_fiber.current
		try {
			$mol_fiber.current = null
			return func()
		} finally {
			$mol_fiber.current = prev
		}
	}

	export function $mol_fiber_unlimit< Result >( task : ()=> Result ) {
		
		const deadline = $mol_fiber.deadline
		
		try {

			$mol_fiber.deadline = Number.POSITIVE_INFINITY
			
			return task()

		} finally {

			$mol_fiber.deadline = deadline

		}

	}

	@ $mol_class
	export class $mol_fiber_solid extends $mol_wrapper {

		static func< This , Args extends any[] , Result >( task : ( this : This , ... args : Args )=> Result ) {

			function wrapped( this : This , ... args : Args ) {

				const deadline = $mol_fiber.deadline

				try {

					$mol_fiber.deadline = Number.POSITIVE_INFINITY
					
					return task.call( this , ... args ) as Result

				} catch( error ) {

					if( 'then' in error ) $mol_fail( new Error( 'Solid fiber can not be suspended.' ) )
					return $mol_fail_hidden( error )

				} finally {

					$mol_fiber.deadline = deadline

				}
		
			}

			Object.defineProperty( wrapped , 'name' , {
				value : `${ task.name || '<anonymous>' }|${ this.name }`
			} )

			return $mol_fiber.func( wrapped )

		}

	}

	@ $mol_class
	export class $mol_fiber< Value = any > extends $mol_wrapper {

		static wrap< This , Args extends any[] , Result >( task : ( this : This , ... args : Args )=> Result ) {
			
			return function( this : This , ... args : Args ) {

				const slave = $mol_fiber.current

				let master = slave && slave.master
				if( !master || master.constructor !== $mol_fiber ) {
					master = new $mol_fiber
					master.calculate = task.bind( this , ... args )
					const prefix = slave ? `${ slave }/${ slave.cursor / 2 }:` : '/'
					master[ Symbol.toStringTag ] = `${ prefix }${ task.name }`
				}
				
				return master.get()

			}

		}

		static quant = 32
		static deadline = 0

		static current = null as null | $mol_fiber
		
		static scheduled = null as null | $mol_after_frame
		static queue = [] as ( ()=> PromiseLike< any > )[]
		
		static async tick() {
	
			while( $mol_fiber.queue.length > 0 ) {

				if( Date.now() > $mol_fiber.deadline ) {
					$mol_fiber.schedule()
					return 
				}

				const task = $mol_fiber.queue.shift()!
				await task()

			}
			
		}

		static schedule() {

			if( !$mol_fiber.scheduled ) {

				$mol_fiber.scheduled = new $mol_after_frame( ()=> {
					$mol_fiber.deadline = Math.max( $mol_fiber.deadline , Date.now() + $mol_fiber.quant )
					$mol_fiber.scheduled = null
					$mol_fiber.tick()
				} )

			}

			const promise : Promise< any > = new this.$.Promise( done => this.queue.push( ()=> ( done() , promise ) ) )
			return promise

		}

		value = undefined as unknown as Value
		error = null as null | Error | PromiseLike< Value >
		cursor = $mol_fiber_status.obsolete
		masters = [] as ( $mol_fiber | number | undefined )[]
		calculate! : ()=> Value
		
		schedule() {
			$mol_fiber.schedule().then( $mol_log_group( '$mol_fiber_scheduled' , this.wake.bind( this ) ) )
		}

		wake() {
			this.$.$mol_log( this , '⏰' )
			try {
				if( this.cursor > $mol_fiber_status.actual ) return this.get()
			} catch( error ) {
				if( 'then' in error ) return
				$mol_fail_hidden( error )
			}
		}

		push( value : Value ) {
			
			value = this.$.$mol_conform( value , this.value )
			
			if( !$mol_compare_any( this.value , value ) ) {
		
				this.$.$mol_log( this , value , '🠈' , this.value  )
				
				this.obsolete_slaves()
				
				this.forget()
				
			} else {
				this.$.$mol_log( this , '✔' , value )
				if( this.error ) this.obsolete_slaves()
			}
			
			this.error = null
			this.value = value
			
			this.complete()

			return value
		}

		fail( error : Error ) : Error {
			
			this.complete()	
			
			this.error = error
			
			this.$.$mol_log( this , '🔥' , error.message )

			this.obsolete_slaves()

			return error
		}

		wait( promise : PromiseLike< Value > ) : PromiseLike< Value > {
			this.error = promise
			this.$.$mol_log( this , '💤' )
			this.cursor = $mol_fiber_status.obsolete
			return promise
		}

		complete() {

			if( this.cursor <= $mol_fiber_status.actual ) return

			for( let index = 0 ; index < this.masters.length ; index += 2  ) {
				this.complete_master( index )
			}
			
			this.cursor = $mol_fiber_status.actual
		}
		
		complete_master( master_index : number ) {
			this.disobey( master_index )
		}

		pull() {
			this.push( this.calculate() )
		}

		update() {

			const slave = $mol_fiber.current
			
			try {
					
				this.error = null
				
				this.limit()
				
				$mol_fiber.current = this

				this.$.$mol_log( this , '►' )

				this.pull()

			} catch( error ) {

				if( 'then' in error ) {
					
					if( !slave ) {
						const listener = this.wake.bind( this )
						error = error.then( listener , listener )
					}

					this.wait( error )

				} else {
					this.fail( error )
				}

			} finally {
				$mol_fiber.current = slave
			}

		}

		get() {

			if( this.cursor > $mol_fiber_status.obsolete ) this.$.$mol_fail( new Error( 'Cyclic dependency' ) )
			
			const slave = $mol_fiber.current
			if( slave ) slave.master = this
			
			if( this.cursor > $mol_fiber_status.actual ) this.update()

			if( this.error ) return this.$.$mol_fail_hidden( this.error )
			
			return this.value

		}

		limit() {

			if( !$mol_fiber.current ) return

			const now = Date.now()

			const overtime = now - $mol_fiber.deadline
			if( overtime < 0 ) return

			/// after debugger
			if( overtime > 500 ) {
				$mol_fiber.deadline = now + $mol_fiber.quant
				return
			}

			this.$.$mol_fail_hidden( $mol_fiber.schedule() )
		}

		get master() {
			return this.masters[ this.cursor ] as $mol_fiber
		}
		set master( next : $mol_fiber ) {

			if( this.cursor === $mol_fiber_status.doubt ) return
			
			const cursor = this.cursor
			const prev = this.masters[ this.cursor ]
			
			if( prev !== next ) {
				if( prev ) this.rescue( prev as $mol_fiber , cursor )
				this.masters[ cursor ] = next
				this.masters[ cursor + 1 ] = this.obey( next , cursor )
			}
			
			this.cursor = cursor + 2
		}

		rescue( master : $mol_fiber , master_index : number ) {}

		obey( master : $mol_fiber , master_index : number ) { return -1 }
		lead( slave : $mol_fiber , master_index : number ) { return -1 }

		dislead( slave_index : number ) {
			this.destructor()
		}

		disobey( master_index : number ) {
			
			const master = this.masters[ master_index ] as $mol_fiber
			if( !master ) return

			master.dislead( this.masters[ master_index + 1 ] as number )
			
			this.masters[ master_index ] = undefined
			this.masters[ master_index + 1 ] = undefined

			this.$.$mol_array_trim( this.masters )

		}

		obsolete_slaves() { }

		obsolete( master_index : number ) { }

		forget() {
			this.value = undefined as unknown as Value
		}

		abort() {
			this.forget()
			return true
		}

		destructor() {
			if( !this.abort() ) return
			
			this.$.$mol_log( this , '🕱' , this.value )
			this.complete()
		}

	}

}
