namespace $ {
	export class $mol_infinite_demo extends $mol_demo_large {
		
		/**
		 * ```tree
		 * title @ \Infinite list demo
		 * ```
		 */
		title() {
			return this.$.$mol_locale.text( '$mol_infinite_demo_title' )
		}
		
		/**
		 * ```tree
		 * chunk_size 20
		 * ```
		 */
		chunk_size() {
			return 20
		}
		
		/**
		 * ```tree
		 * sub / <= Scroll
		 * ```
		 */
		sub() {
			return [
				this.Scroll()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * after!anchor_id /
		 * ```
		 */
		after(anchor_id: any) {
			return [
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * Item!id $mol_filler
		 * ```
		 */
		@ $mol_mem_key
		Item(id: any) {
			const obj = new this.$.$mol_filler()
			
			return obj
		}
		
		/**
		 * ```tree
		 * List $mol_infinite
		 * 	after!anchor_id <= after!anchor_id
		 * 	Row!id <= Item!id
		 * ```
		 */
		@ $mol_mem
		List() {
			const obj = new this.$.$mol_infinite()
			
			obj.after = (anchor_id: any) => this.after(anchor_id)
			obj.Row = (id: any) => this.Item(id)
			
			return obj
		}
		
		/**
		 * ```tree
		 * Scroll $mol_scroll sub / <= List
		 * ```
		 */
		@ $mol_mem
		Scroll() {
			const obj = new this.$.$mol_scroll()
			
			obj.sub = () => [
				this.List()
			] as readonly any[]
			
			return obj
		}
	}
	
}

