import os
import io
import textwrap
import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt
from fpdf import FPDF

class SurveyPDF(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        # Try to use DejaVu I if it was loaded, else use regular DejaVu, else Helvetica
        try:
            self.set_font("DejaVu", "I", 8)
        except:
            try:
                self.set_font("DejaVu", "", 8)
            except:
                self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Сторінка {self.page_no()}/{{nb}}", 0, 0, "C")

def generate_chart_image(q_type, data, font_path=None):
    if not data or not isinstance(data, dict):
        return None
        
    # Setup font for Matplotlib
    if font_path and os.path.exists(font_path):
        try:
            from matplotlib import font_manager
            fe = font_manager.FontEntry(fname=font_path, name='CustomFont')
            font_manager.fontManager.ttflist.insert(0, fe)
            plt.rcParams['font.family'] = fe.name
        except:
            pass

    num_items = len(data)
    
    def wrap_text(text, width=50):
        return "\n".join(textwrap.wrap(str(text), width))

    # Decision logic: use Pie for single_choice with few options, else Bar
    use_pie = (q_type == "single_choice" and num_items <= 8)

    if use_pie:
        plt.figure(figsize=(10, 6))
        labels = list(data.keys())
        values = list(data.values())
        
        # We use a legend instead of labels on slices to prevent overlapping
        # Shorten labels for legend if needed
        legend_labels = [wrap_text(l, 40) for l in labels]
        
        patches, texts, autotexts = plt.pie(
            values, 
            autopct='%1.1f%%', 
            startangle=140,
            pctdistance=0.85,
            colors=plt.cm.Paired(range(len(labels)))
        )
        
        # Make percent text readable
        for autotext in autotexts:
            autotext.set_color('black')
            autotext.set_weight('bold')
            autotext.set_size(9)

        plt.legend(patches, legend_labels, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
        plt.axis('equal')
        fig_height = 6
    elif q_type == "matrix":
        fig_height = max(5, num_items * 0.6)
        plt.figure(figsize=(10, fig_height))
        categories = list(data.keys())
        if not categories: 
            plt.close()
            return None
        
        all_options = set()
        for cat in categories:
            if isinstance(data[cat], dict):
                all_options.update(data[cat].keys())
        
        all_options = sorted(list(all_options))
        if not all_options:
            plt.close()
            return None

        import numpy as np
        y = np.arange(len(categories))
        height = 0.8 / len(all_options)
        
        for i, opt in enumerate(all_options):
            vals = [data[cat].get(opt, 0) if isinstance(data[cat], dict) else 0 for cat in categories]
            plt.barh(y + i*height, vals, height, label=wrap_text(opt, 20))
        
        plt.yticks(y + height*(len(all_options)-1)/2, [wrap_text(c, 30) for c in categories])
        plt.legend(loc='upper center', bbox_to_anchor=(0.5, -0.15), ncol=2)
        plt.gca().invert_yaxis()
        plt.gcf().set_size_inches(10, fig_height + 2)
    else:
        # Horizontal bars for everything else
        fig_height = max(5, num_items * 0.6)
        plt.figure(figsize=(10, fig_height))
        labels = [wrap_text(l) for l in data.keys()]
        values = list(data.values())
        
        bars = plt.barh(labels, values, color='#4e79a7')
        plt.xlabel('Кількість відповідей')
        plt.gca().invert_yaxis()
        
        for bar in bars:
            width = bar.get_width()
            plt.text(width + 0.1, bar.get_y() + bar.get_height()/2, 
                     f'{int(width)}', va='center')

    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', dpi=150, bbox_inches='tight')
    plt.close()
    img_buf.seek(0)
    return img_buf

def generate_survey_pdf(survey):
    if not survey:
        return b""

    pdf = SurveyPDF()
    pdf.alias_nb_pages()
    
    # Check for fonts
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "C:\\Windows\\Fonts\\arial.ttf"
    ]
    
    font_path = next((p for p in font_paths if os.path.exists(p)), None)

    if font_path:
        try:
            pdf.add_font("DejaVu", "", font_path)
            
            # Find bold/italic versions more intelligently
            bold_path = font_path.replace(".ttf", "-Bold.ttf") if "/usr/share/fonts" in font_path else font_path.replace(".ttf", "bd.ttf")
            if os.path.exists(bold_path):
                pdf.add_font("DejaVu", "B", bold_path)
            else:
                pdf.add_font("DejaVu", "B", font_path)
                
            italic_path = font_path.replace(".ttf", "-Oblique.ttf") if "/usr/share/fonts" in font_path else font_path.replace(".ttf", "i.ttf")
            if os.path.exists(italic_path):
                pdf.add_font("DejaVu", "I", italic_path)
            
            font_name = "DejaVu"
        except Exception as e:
            print(f"Error loading font: {e}")
            font_name = "Helvetica"
    else:
        font_name = "Helvetica"

    pdf.add_page()
    
    # Title
    pdf.set_font(font_name, "B", 20)
    pdf.multi_cell(190, 15, str(survey.get("title", "Опитування")), align="C")
    
    pdf.set_font(font_name, "", 12)
    pdf.ln(5)
    
    # Metadata
    pdf.cell(0, 10, f"Організація: {str(survey.get('organization', 'N/A'))}", ln=True)
    pdf.cell(0, 10, f"Дата: {str(survey.get('date', 'N/A'))}", ln=True)
    pdf.cell(0, 10, f"Кількість учасників: {str(survey.get('participants', 0))}", ln=True)
    pdf.ln(10)
    
    # Questions
    questions = survey.get("questions", [])
    for i, q in enumerate(questions):
        if not isinstance(q, dict): continue
        
        if pdf.get_y() > 230:
            pdf.add_page()

        pdf.set_font(font_name, "B", 14)
        pdf.multi_cell(190, 10, f"{i+1}. {str(q.get('text', ''))}")
        pdf.ln(2)
        
        pdf.set_font(font_name, "", 10)
        q_type = str(q.get("type", "text"))
        data = q.get("data", {})
        
        if q_type != "text" and isinstance(data, dict):
            try:
                img_buf = generate_chart_image(q_type, data, font_path)
                if img_buf:
                    num_items = len(data)
                    img_h_mm = max(40, num_items * 10)
                    if q_type == "matrix": img_h_mm += 20
                    
                    if pdf.get_y() + img_h_mm > 270:
                        pdf.add_page()
                    
                    pdf.image(img_buf, x=15, w=180)
                    pdf.ln(5)
            except Exception as e:
                pdf.set_text_color(255, 0, 0)
                pdf.set_font(font_name, "I", 10)
                pdf.cell(0, 10, f"(Помилка побудови графіка: {str(e)})", ln=True)
                pdf.set_text_color(0, 0, 0)
                pdf.set_font(font_name, "", 10)

        # Better handling for all non-text types (Choice, Rating, etc.)
        if q_type != "text" and isinstance(data, dict):
            for option, count in data.items():
                if isinstance(count, dict): continue # Handle Matrix later
                if pdf.get_y() > 275: pdf.add_page()
                pdf.set_x(20)
                pdf.multi_cell(170, 8, f"- {str(option)}: {str(count)}")
            
            # Special logic for Matrix data in text list
            if q_type == "matrix":
                for category, options in data.items():
                    if pdf.get_y() > 260: pdf.add_page()
                    pdf.set_font(font_name, "B", 10)
                    pdf.set_x(20)
                    pdf.multi_cell(170, 8, f"{str(category)}:")
                    pdf.set_font(font_name, "", 10)
                    if isinstance(options, dict):
                        for opt, val in options.items():
                            if pdf.get_y() > 275: pdf.add_page()
                            pdf.set_x(30)
                            pdf.multi_cell(160, 8, f"- {str(opt)}: {str(val)}")
                            
        elif q_type == "text" and isinstance(data, dict):
            answers = data.get("answers", [])
            if isinstance(answers, list):
                for ans in answers[:20]:
                    if pdf.get_y() > 275: pdf.add_page()
                    pdf.set_x(20)
                    pdf.multi_cell(170, 7, f"* {str(ans)}")
                if len(answers) > 20:
                    pdf.set_x(20)
                    pdf.cell(0, 8, f"... та ще {len(answers)-20} відповідей", ln=True)

        pdf.ln(5)
        
        analysis = q.get("ai_analysis")
        if analysis:
            lines = len(str(analysis)) / 80
            est_h = lines * 7 + 15
            if pdf.get_y() + est_h > 270:
                pdf.add_page()
                
            pdf.set_fill_color(240, 240, 240)
            pdf.set_font(font_name, "B", 11)
            pdf.cell(0, 10, "AI Аналіз:", ln=True, fill=True)
            pdf.set_font(font_name, "", 10)
            pdf.multi_cell(190, 7, str(analysis), fill=True)
            pdf.ln(5)
        
        pdf.ln(5)

    return pdf.output()
