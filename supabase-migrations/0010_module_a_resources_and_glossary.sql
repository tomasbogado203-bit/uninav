-- Migration 0010: Tablas y Datos de Prueba para Módulo A (career_resources y glossary_terms)

-- 1. TABLA career_resources
CREATE TABLE IF NOT EXISTS career_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('software', 'plantilla', 'otro')),
  description text NOT NULL,
  quickstart_url text,
  download_url text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. TABLA glossary_terms
CREATE TABLE IF NOT EXISTS glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE career_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read career_resources" ON career_resources;
CREATE POLICY "Anyone authenticated can read career_resources" ON career_resources
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can read glossary_terms" ON glossary_terms;
CREATE POLICY "Anyone authenticated can read glossary_terms" ON glossary_terms
  FOR SELECT USING (true);

-- SEED DATA DE PRUEBA DE HERRAMIENTAS Y GLOSARIO UNIVERSITARIO (15 Términos)
INSERT INTO glossary_terms (term, definition) VALUES
('Correlatividades', 'Materias que es obligatorio haber aprobado o regularizado previamente para poder cursar o rendir una materia de un cuatrimestre posterior.'),
('Promoción', 'Régimen de aprobación directa de una materia sin necesidad de rendir examen final. Se obtiene alcanzando una nota alta (habitualmente 7 o más) en los exámenes parciales y trabajos prácticos.'),
('Regularidad', 'Condición en la que queda el alumno tras aprobar los exámenes parciales de la cursada. Otorga el derecho a presentarse a rendir el Examen Final dentro de un plazo determinado (usualmente 2 a 3 años).'),
('Examen Final', 'Evaluación integradora e individual de toda la materia que debe rendirse ante un tribunal docente tras haber obtenido la condición de alumno regular.'),
('Cátedra', 'Equipo docente a cargo del dictado de una materia, encabezado por un Profesor Titular y acompañado por adjuntos y jefes de trabajos prácticos (JTP).'),
('Régimen de Cursada', 'Conjunto de reglas específicas de una materia sobre asistencias requeridas, fechas de parciales, recuperatorios y condiciones de aprobación.'),
('Recursar', 'Volver a cursar una materia desde cero en un cuatrimestre posterior por no haber alcanzado la condición de regular ni promovido.'),
('Trabajo Práctico (TP)', 'Instancia de aplicación práctica, laboratorio o informe en equipo requerido para evaluar los conocimientos aplicados de la asignatura.'),
('Mesa de Examen', 'Período o fecha específica fijada por la facultad en las llamadas "fechas de finales" (Febrero/Marzo, Julio/Agosto, Diciembre) para rendir examen final.'),
('Cuatrimestre', 'Período académico de dictado de clases que dura aproximadamente 16 semanas (1er cuatrimestre: Marzo-Julio; 2do cuatrimestre: Agosto-Diciembre).'),
('Recuperatorio', 'Instancia de evaluación alternativa para recuperar un examen parcial desaprobado o al que se estuvo ausente por causa justificada.'),
('SIU Guaraní', 'Sistema de gestión académica utilizado por la mayoría de las universidades nacionales argentinas para inscribirse a materias, exámenes finales y consultar la historia académica.'),
('Libre (Alumno Libre)', 'Condición del estudiante que desaprobó los parciales o no cumplió con la asistencia requerida. En algunas materias permite rendir un examen libre (escrito + oral integrador).'),
('Plan de Estudios', 'Estructura curricular oficial de la carrera que detalla las asignaturas por año/cuatrimestre, su carga horaria y el régimen de correlatividades.'),
('Créditos / Carga Horaria', 'Cantidad de horas reloj semanales o totales asignadas a una materia en el plan de estudios para computar la dedicación requerida.')
ON CONFLICT DO NOTHING;

INSERT INTO career_resources (tool_name, category, description, quickstart_url, download_url, display_order) VALUES
('Notion', 'plantilla', 'Organizador personal y base de conocimiento ideal para tomar apuntes de cursada, gestionar horarios y armar tu plan de estudio.', 'https://www.notion.so/help', 'https://www.notion.so/desktop', 1),
('Zotero', 'software', 'Gestor de referencias bibliográficas gratuito y de código abierto para organizar citas, documentos PDF y redactar bibliografías.', 'https://www.zotero.org/support/', 'https://www.zotero.org/download/', 2),
('Visual Studio Code', 'software', 'Editor de código fuente ligero y potente con extensiones para Python, C++, Java, LaTeX y desarrollo web.', 'https://code.visualstudio.com/docs', 'https://code.visualstudio.com/Download', 3),
('GeoGebra', 'software', 'Calculadora gráfica interactiva de geometría, álgebra, cálculo y estadística para visualizar conceptos matemáticos.', 'https://www.geogebra.org/help', 'https://www.geogebra.org/download', 4),
('Obsidian', 'software', 'Aplicación de notas en Markdown conectadas mediante grafos para estructurar mapas de conocimiento personal.', 'https://help.obsidian.md/', 'https://obsidian.md/download', 5),
('Canva', 'plantilla', 'Plataforma de diseño gráfico simplificado para armar presentaciones visuales de Trabajos Prácticos y pósteres académicos.', 'https://www.canva.com/designschool/', 'https://www.canva.com/download/', 6)
ON CONFLICT DO NOTHING;
