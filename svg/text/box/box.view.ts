namespace $.$$ {
	export class $mol_svg_text_box extends $.$mol_svg_text_box {

		@ $mol_mem
		box_width() {
			return this.text_width(this.text())
		}

		box_pos_x() {
			const align = this.align()
			if (align === 'end') return `calc(${this.pos_x()} - ${this.box_width()})`
			if (align === 'middle') return `calc(${this.pos_x()} - ${Math.round(this.box_width() / 2)})`

			return this.pos_x()
		}

		box_pos_y() {
			return `calc(${this.pos_y()} - ${this.font_size() - 2})`
		}
	}
	
}
