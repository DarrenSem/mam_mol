namespace $ {
	export class $mol_labeler extends $mol_list {
		
		/**
		 * ```tree
		 * rows /
		 * 	<= Label
		 * 	<= Content
		 * ```
		 */
		rows() {
			return [
				this.Label(),
				this.Content()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * label /$mol_view_content <= title
		 * ```
		 */
		label() {
			return [
				this.title()
			] as readonly $mol_view_content[]
		}
		
		/**
		 * ```tree
		 * Label $mol_view
		 * 	minimal_height 16
		 * 	sub <= label
		 * ```
		 */
		@ $mol_mem
		Label() {
			const obj = new this.$.$mol_view()
			
			obj.minimal_height = () => 16
			obj.sub = () => this.label()
			
			return obj
		}
		
		/**
		 * ```tree
		 * content /
		 * ```
		 */
		content() {
			return [
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * Content $mol_view
		 * 	minimal_height 24
		 * 	sub <= content
		 * ```
		 */
		@ $mol_mem
		Content() {
			const obj = new this.$.$mol_view()
			
			obj.minimal_height = () => 24
			obj.sub = () => this.content()
			
			return obj
		}
	}
	
}

