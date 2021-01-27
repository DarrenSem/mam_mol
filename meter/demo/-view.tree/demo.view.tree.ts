namespace $ {
	export class $mol_meter_demo extends $mol_demo_small {
		
		/**
		 * ```tree
		 * title @ \Real time offset and size metering
		 * ```
		 */
		title() {
			return this.$.$mol_locale.text( '$mol_meter_demo_title' )
		}
		
		/**
		 * ```tree
		 * plugins / <= Meter
		 * ```
		 */
		plugins() {
			return [
				this.Meter()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * sub /
		 * 	<= Top
		 * 	<= Height
		 * ```
		 */
		sub() {
			return [
				this.Top(),
				this.Height()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * top
		 * ```
		 */
		top() {
			return this.Meter().top()
		}
		
		/**
		 * ```tree
		 * height
		 * ```
		 */
		height() {
			return this.Meter().height()
		}
		
		/**
		 * ```tree
		 * Meter $mol_meter
		 * 	top => top
		 * 	height => height
		 * ```
		 */
		@ $mol_mem
		Meter() {
			const obj = new this.$.$mol_meter()
			
			return obj
		}
		
		/**
		 * ```tree
		 * Top $mol_view sub /
		 * 	\Offset from top: 
		 * 	<= top
		 * ```
		 */
		@ $mol_mem
		Top() {
			const obj = new this.$.$mol_view()
			
			obj.sub = () => [
				"Offset from top: ",
				this.top()
			] as readonly any[]
			
			return obj
		}
		
		/**
		 * ```tree
		 * Height $mol_view sub /
		 * 	\Component height: 
		 * 	<= height
		 * ```
		 */
		@ $mol_mem
		Height() {
			const obj = new this.$.$mol_view()
			
			obj.sub = () => [
				"Component height: ",
				this.height()
			] as readonly any[]
			
			return obj
		}
	}
	
}

