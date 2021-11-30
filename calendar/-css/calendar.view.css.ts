namespace $ { $mol_style_attach( "mol/calendar/calendar.view.css",
 "[mol_calendar] {\n\tdisplay: table;\n\tfont-family: monospace;\n\tfont-family: var(--mol_skin_font_monospace);\n}\n\n[mol_calendar_head] {\n\tdisplay: table-caption;\n}\n\n[mol_calendar_title] {\n\tjustify-content: center;\n}\n\n[mol_calendar_weekdays] ,\n[mol_calendar_week] {\n\tdisplay: table-row;\n\tpadding: 0;\n}\n\n[mol_calendar_day] {\n\tdisplay: table-cell;\n\tpadding: .25rem .5rem;\n\ttext-align: center;\n\tword-break: normal;\n\tbox-shadow: none;\n\tborder-radius: var(--mol_gap_round);\n}\n\n[mol_calendar_weekday] {\n\tborder-bottom: 1px solid var(--mol_theme_line);\n}\n\n[mol_calendar_holiday] {\n\tcolor: var(--mol_skin_base);\n}\n\n[mol_calendar_ghost] {\n\topacity: .25;\n}\n"
) }