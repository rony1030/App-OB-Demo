/* Maintains static interface copy. Never reads customer or CRM data. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const spanish = /[áéíóúñ¿¡]|\b(agencia|proyecto|proyectos|guardar|cancelar|correo|nombre|todos|acceso|solicitud|solicitudes|contraseña|unidad|unidades|reserva|reservas|crear|editar|eliminar|selecciona|seleccionar|cargando|volver|cerrar|buscar|configuración|documentos|pagos|disponible|disponibles|sin|para|puedes|debes|revisa|completa|completar|enviar|enviado|nueva|nuevo|ver|desde|hasta|meses|teléfono|contacto|precio|datos|registrar|personas|empresa|empresas)\b/i;
const sources = new Set();
const candidates = [];
function staticAttribute(value){if(!value)return false;if(ts.isStringLiteral(value))return true;if(ts.isJsxExpression(value)&&value.expression)value=value.expression;return ts.isConditionalExpression(value)&&staticAttribute(value.whenTrue)&&staticAttribute(value.whenFalse);}
function walk(dir) { for (const item of fs.readdirSync(dir, {withFileTypes:true})) { const file = path.join(dir,item.name); if(item.isDirectory()) walk(file); else if(file.endsWith('.tsx') && !/[\\/]i18n[\\/]|[\\/]presentations[\\/]|[\\/]branding[\\/]/.test(file) && !/layout\.tsx$/.test(file)) candidates.push(file); } }
walk(path.join(root,'components')); walk(path.join(root,'app'));
let covered = 0;
for (const file of candidates) {
  const code = fs.readFileSync(file,'utf8');
  const ast = ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const edits=[]; let hasCopy=false;
  function scan(node) {
    if(ts.isJsxText(node) || ts.isStringLiteral(node)) {
      const value = (ts.isJsxText(node) ? node.getText(ast) : node.text).replace(/\s+/g,' ').trim();
      const textProp = ts.isStringLiteral(node) && ts.isJsxExpression(node.parent) && ts.isJsxAttribute(node.parent.parent) && node.parent.parent.name.getText(ast)==='text' && node.parent.parent.parent.parent.tagName?.getText(ast)==='LocalizedText';
      const visible = textProp || ts.isJsxText(node) || (ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent) && ['title','placeholder','aria-label','alt','label','description'].includes(node.parent.name.getText(ast)));
      if(value.length>1 && !value.startsWith('/') && value.length<1200 && (spanish.test(value) || visible && /[A-Za-zÀ-ÿ]/.test(value))) { sources.add(value); hasCopy=true; }
    }
    ts.forEachChild(node,scan);
  }
  scan(ast);
  if (!hasCopy) continue;
  function wrap(node) {
    if(ts.isJsxText(node) && /[A-Za-zÀ-ÿ]/.test(node.text) && node.text.trim()) {
      edits.push({start:node.getFullStart(),end:node.end,text:`<LocalizedText text={${JSON.stringify(node.text.replace(/\s+/g,' ').trim())}} />`});
    }
    if(ts.isJsxExpression(node) && node.expression) {
      const attribute=ts.isJsxAttribute(node.parent);
      function literals(value) {
        if(ts.isStringLiteral(value) && spanish.test(value.text) && !attribute) edits.push({start:value.getStart(ast),end:value.end,text:`<LocalizedText text={${JSON.stringify(value.text)}} />`});
        else if(ts.isConditionalExpression(value)){literals(value.whenTrue);literals(value.whenFalse);}
      }
      literals(node.expression);
    }
    if(ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening=ts.isJsxElement(node)?node.openingElement:node;
      const alreadyWrapped=ts.isJsxElement(node.parent) && node.parent.openingElement.tagName.getText(ast)==='UITranslationBoundary';
      if(!alreadyWrapped && opening.attributes.properties.some(attribute=>ts.isJsxAttribute(attribute) && ['title','placeholder','aria-label','alt','label','description'].includes(attribute.name.getText(ast)) && staticAttribute(attribute.initializer))) {
        edits.push({start:node.getStart(ast),end:node.getStart(ast),text:'<UITranslationBoundary>'});
        edits.push({start:node.end,end:node.end,text:'</UITranslationBoundary>'});
      }
    }
    ts.forEachChild(node,wrap);
  }
  wrap(ast);
  if(edits.length) {
    covered++;
    if(process.argv.includes('--apply')) {
      let next=code; for(const edit of edits.sort((a,b)=>b.start-a.start || (a.text.startsWith('</')?1:-1))) next=next.slice(0,edit.start)+edit.text+next.slice(edit.end);
      const importAt=ast.statements[0] && ts.isExpressionStatement(ast.statements[0]) && ts.isStringLiteral(ast.statements[0].expression) ? ast.statements[0].end : 0;
      if(next.includes("from '@/components/i18n/UITranslationBoundary'")) next=next.replace(/import \{[^}]*\} from '@\/components\/i18n\/UITranslationBoundary';/,"import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';");
      else next=next.slice(0,importAt)+"\nimport { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';\n"+next.slice(importAt);
      fs.writeFileSync(file,next);
    }
  }
}
fs.writeFileSync(path.join(root,'lib/i18n/interface-source.json'),JSON.stringify([...sources].sort(),null,2)+'\n');
console.log(`${sources.size} static phrases; ${covered} interface files.`);
