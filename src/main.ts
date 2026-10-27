import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

interface Row { id: string; folder: string; offense: string; }
interface RegistryRow extends Row { status: string; reason: string | null; }
interface Proposal {
  kind: string; period: string; rows?: Row[];
  complements?: {id: string; status: string}[];
  victimId?: string; newOffense?: string; reason?: string;
}
interface Cut { monthly: Row[]; registry: RegistryRow[]; }
interface State {
  revision: number; cuts: Record<string, Cut>;
  pending: {id: string; baseRevision: number; request: Proposal} | null;
  audit: {revision: number; kind: string; period: string; at: string}[];
}
const rows: Row[] = [
  {id: 'DEMO-V001', folder: 'DEMO-C001', offense: 'DESAPARICION'},
  {id: 'DEMO-V002', folder: 'DEMO-C001', offense: 'DESAPARICION'}
];
const added: Row = {id: 'DEMO-V003', folder: 'DEMO-C002', offense: 'DESAPARICION'};
const examples: {label: string; note: string; request: Proposal}[] = [
  {label: '1 · Carga mensual', note: 'Dos víctimas ficticias comparten una carpeta. Validar crea una propuesta; después pulsa Aprobar.',
    request: {kind: 'MONTHLY', period: '2026-09', rows}},
  {label: '2 · Complementar BANCI', note: 'Completa exactamente las dos desapariciones del mensual aprobado.',
    request: {kind: 'REGISTRY', period: '2026-09', complements: rows.map(r => ({id: r.id, status: 'NO_LOCALIZADA'}))}},
  {label: '3 · Reclasificar una víctima', note: 'DEMO-V001 deja de contar como desaparición. DEMO-V002 conserva su condición. Aprobar registra el cambio en BANCI.',
    request: {kind: 'RECLASSIFY', period: '2026-09', victimId: 'DEMO-V001', newOffense: 'NO_DELITO', reason: 'Motivo ficticio para demostrar el flujo'}},
  {label: '4 · Error: contradicción', note: 'Debe bloquearse: el mensual vuelve a incluir como desaparición a DEMO-V001, ya reclasificada.',
    request: {kind: 'MONTHLY', period: '2026-09', rows}},
  {label: '5 · Error: falta complemento', note: 'Se retira la reclasificada y se añade DEMO-V003. Debe solicitar su complementario BANCI.',
    request: {kind: 'MONTHLY', period: '2026-09', rows: [rows[1], added]}},
  {label: '6 · Cruce correcto', note: 'Omite la reclasificada y aporta el complemento de la nueva. Aprobar integra ambas partes juntas.',
    request: {kind: 'MONTHLY', period: '2026-09', rows: [rows[1], added], complements: [{id: added.id, status: 'NO_LOCALIZADA'}]}},
  {label: '7 · Revertir reclasificación', note: 'Restituye DEMO-V001 como desaparición vigente en BANCI. El mensual deberá volver a incluirla en su próxima actualización.',
    request: {kind: 'REVERT', period: '2026-09', victimId: 'DEMO-V001', reason: 'Reversión ficticia de demostración'}},
  {label: '8 · Alinear tras reversión', note: 'Las tres víctimas vuelven a coincidir con BANCI. No se piden complementarios porque ya existen.',
    request: {kind: 'MONTHLY', period: '2026-09', rows: [...rows, added]}}
];

@Component({
  selector: 'portfolio-app', standalone: true, imports: [FormsModule],
  template: `
  <aside><a class="brand" href="/">S<span>III</span>D<small>PORTFOLIO LAB</small></a>
    <p class="overline">DEMOSTRACIÓN LOCAL</p><h2>De la carga<br>a la conciliación.</h2>
    <p>Un flujo con revisión previa, trazabilidad y reclasificaciones reversibles.</p>
    <div class="side-note">Datos ficticios · Sin conexión institucional<br>Estado temporal en memoria</div>
  </aside>
  <main><header><div><p class="overline">MENSUAL + BANCI</p><h1>Control de cargas</h1></div>
    <span class="badge">DEMO · Septiembre 2026</span></header>
    <section class="metrics" aria-label="Resumen aprobado">
      <article><span>Víctimas en mensual</span><strong>{{cut().monthly.length}}</strong></article>
      <article><span>Desapariciones vigentes</span><strong>{{active()}}</strong></article>
      <article><span>Reclasificaciones</span><strong>{{cut().registry.length - active()}}</strong></article>
      <article><span>Revisión del estado</span><strong>{{state().revision}}</strong></article>
    </section>
    <section class="panel"><div class="panel-title"><div><p class="overline">RECORRIDO GUIADO</p><h2>Validar una propuesta</h2></div>
      <label>Escenario<select [ngModel]="selected" (ngModelChange)="select($event)" [disabled]="busy()">
        @for (example of examples; track $index) {<option [ngValue]="$index">{{example.label}}</option>}
      </select></label></div>
      <p>{{examples[selected].note}}</p>
      <label for="payload">Contenido JSON de prueba</label>
      <textarea id="payload" [ngModel]="payload" (ngModelChange)="payload=$event" spellcheck="false" [disabled]="busy()"></textarea>
      <div class="actions"><button (click)="submit()" [disabled]="busy() || !!state().pending">Validar y enviar a revisión</button>
        <button class="secondary" (click)="refresh()" [disabled]="busy()">Actualizar estado</button></div>
      @if (error()) {<p class="notice error" role="alert">{{error()}}</p>}
      @if (message()) {<p class="notice success" role="status">{{message()}}</p>}
    </section>
    @if (state().pending; as pending) {
      <section class="panel pending"><p class="overline">REVISIÓN SIMULADA · SIN ROLES REALES</p>
        <h2>Propuesta pendiente: {{pending.request.kind}}</h2>
        <p>El estado aprobado permanece igual hasta aceptar. Rechazar descarta la propuesta y conserva los datos aprobados.</p>
        <pre>{{pendingJson()}}</pre>
        <div class="actions"><button (click)="decide('approve')" [disabled]="busy()">Aprobar propuesta</button>
          <button class="secondary" (click)="decide('reject')" [disabled]="busy()">Rechazar propuesta</button></div>
      </section>
    }
    <div class="tables"><section class="panel"><h2>Mensual aprobado</h2><div class="table-wrap"><table>
      <thead><tr><th>Víctima ficticia</th><th>Carpeta</th><th>Delito</th></tr></thead><tbody>
      @for (row of cut().monthly; track row.id) {<tr><td>{{row.id}}</td><td>{{row.folder}}</td><td>{{row.offense}}</td></tr>}
      @empty {<tr><td colspan="3">Aún no hay una carga aprobada.</td></tr>}
      </tbody></table></div></section>
      <section class="panel"><h2>BANCI · histórico</h2><div class="table-wrap"><table>
      <thead><tr><th>Víctima ficticia</th><th>Clasificación actual</th><th>Situación</th></tr></thead><tbody>
      @for (row of cut().registry; track row.id) {<tr><td>{{row.id}}</td><td><span [class.reclassified]="row.offense !== 'DESAPARICION'">{{row.offense}}</span></td><td>{{row.status}}</td></tr>}
      @empty {<tr><td colspan="3">Pendiente de complementarios.</td></tr>}
      </tbody></table></div></section></div>
    <section class="panel"><h2>Bitácora de operaciones</h2><div class="table-wrap"><table>
      <thead><tr><th>Revisión</th><th>Operación</th><th>Periodo</th><th>Fecha UTC</th></tr></thead><tbody>
      @for (entry of state().audit; track entry.revision) {<tr><td>{{entry.revision}}</td><td>{{entry.kind}}</td><td>{{entry.period}}</td><td>{{entry.at}}</td></tr>}
      @empty {<tr><td colspan="4">Las aprobaciones y rechazos aparecerán aquí.</td></tr>}
      </tbody></table></div></section>
    <footer>Demostración independiente de arquitectura y reglas. No representa un servicio oficial.</footer>
  </main>`
})
export class App {
  readonly examples = examples;
  selected = 0;
  payload = JSON.stringify(examples[0].request, null, 2);
  readonly state = signal<State>({revision: 0, cuts: {}, pending: null, audit: []});
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  constructor() { void this.refresh(); }
  cut = () => this.state().cuts['2026-09'] ?? {monthly: [], registry: []};
  active = () => this.cut().registry.filter(v => v.offense === 'DESAPARICION').length;
  pendingJson = () => JSON.stringify(this.state().pending?.request, null, 2);
  select(index: number) { this.selected = index; this.payload = JSON.stringify(examples[index].request, null, 2); this.error.set(''); this.message.set(''); }
  private async request(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch('/api/' + path, body === undefined ? {} : {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? 'No se pudo procesar la solicitud. Comprueba que la API esté iniciada.');
    return data;
  }
  async refresh() {
    this.busy.set(true); this.error.set('');
    try { this.state.set(await this.request('state') as State); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'Error de conexión.'); }
    finally { this.busy.set(false); }
  }
  async submit() {
    this.busy.set(true); this.error.set(''); this.message.set('');
    try {
      const value: unknown = JSON.parse(this.payload);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Introduce un objeto JSON válido.');
      await this.request('proposals', value);
      this.state.set(await this.request('state') as State);
      this.message.set('Validación correcta. La propuesta espera aprobación.');
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'Error de validación.'); }
    finally { this.busy.set(false); }
  }
  async decide(action: 'approve' | 'reject') {
    const id = this.state().pending?.id;
    if (!id) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    try {
      this.state.set(await this.request('proposals/' + id + '/' + action, {}) as State);
      this.message.set(action === 'approve' ? 'Propuesta aprobada. Estado integrado.' : 'Propuesta rechazada. Datos aprobados conservados.');
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'Error de revisión.'); }
    finally { this.busy.set(false); }
  }
}
bootstrapApplication(App).catch(console.error);
