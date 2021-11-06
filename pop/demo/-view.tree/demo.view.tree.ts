namespace $ {
	export class $mol_pop_demo extends $mol_demo_small {
		
		/**
		 * ```tree
		 * title @ \Pop up block with various alignment
		 * ```
		 */
		title() {
			return this.$.$mol_locale.text( '$mol_pop_demo_title' )
		}
		
		/**
		 * ```tree
		 * sub / <= Pop
		 * ```
		 */
		sub() {
			return [
				this.Pop()
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * tags /
		 * 	\$mol_pop
		 * 	\$mol_row
		 * 	\$mol_button
		 * 	\popup
		 * 	\menu
		 * 	\container
		 * ```
		 */
		tags() {
			return [
				"$mol_pop",
				"$mol_row",
				"$mol_button",
				"popup",
				"menu",
				"container"
			] as readonly any[]
		}
		
		/**
		 * ```tree
		 * show_text @ \?
		 * ```
		 */
		show_text() {
			return this.$.$mol_locale.text( '$mol_pop_demo_show_text' )
		}
		
		/**
		 * ```tree
		 * Show $mol_button_minor title <= show_text
		 * ```
		 */
		@ $mol_mem
		Show() {
			const obj = new this.$.$mol_button_minor()
			
			obj.title = () => this.show_text()
			
			return obj
		}
		
		/**
		 * ```tree
		 * showed <= focused
		 * ```
		 */
		showed() {
			return this.focused()
		}
		
		/**
		 * ```tree
		 * bubble_hint @ \This is $mol_pop
		 * ```
		 */
		bubble_hint() {
			return this.$.$mol_locale.text( '$mol_pop_demo_bubble_hint' )
		}
		
		/**
		 * ```tree
		 * Content $mol_row sub / <= bubble_hint
		 * ```
		 */
		@ $mol_mem
		Content() {
			const obj = new this.$.$mol_row()
			
			obj.sub = () => [
				this.bubble_hint()
			] as readonly any[]
			
			return obj
		}
		
		/**
		 * ```tree
		 * Pop $mol_pop
		 * 	Anchor <= Show
		 * 	showed <= showed
		 * 	bubble_content / <= Content
		 * ```
		 */
		@ $mol_mem
		Pop() {
			const obj = new this.$.$mol_pop()
			
			obj.Anchor = () => this.Show()
			obj.showed = () => this.showed()
			obj.bubble_content = () => [
				this.Content()
			] as readonly any[]
			
			return obj
		}
	}
	
}

