namespace $ {
	
	export class $mol_notify {
		
		@ $mol_mem
		static allowed( next?: boolean ) {
			return false
		}
		
		@ $mol_fiber.method
		static show( info: {
			context: string,
			message: string,
			uri: string
		} ) {
		}
		
	}
	
}
