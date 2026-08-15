import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, CreditCard, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { isAppError } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { formatBps } from '../format-bps'
import { useSimulatePurchaseDecision } from '../queries'
import { useStoredRates, type StoredRates } from '../hooks/useStoredRates'
import {
  SCENARIO_KIND_LABELS,
  type DownPaymentPlanInput,
  type ScenarioInput,
  type ScenarioKind,
} from '../types'
import { BalanceChart } from './BalanceChart'
import { ScenarioResultCard } from './ScenarioResultCard'
import { ThreeWayComparison } from './ThreeWayComparison'

const inputCls =
  'flex h-10 w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text ' +
  'placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500'

const SCENARIO_KINDS: ScenarioKind[] = ['cdi', 'selic', 'fixa']

function toScenarios(rates: StoredRates): ScenarioInput[] {
  return SCENARIO_KINDS.filter((kind) => rates[kind].enabled).map((kind) => ({
    kind,
    annualRateBps: rates[kind].rateBps,
    cdiPercentBps: kind === 'cdi' ? rates[kind].cdiPercentBps : 0,
    taxExempt: rates[kind].taxExempt,
  }))
}

export function DecisionSimulator() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [cashPrice, setCashPrice] = useState(0)
  const [installmentsCount, setInstallmentsCount] = useState(10)
  const [installmentAmount, setInstallmentAmount] = useState(0)
  const [rates, setRates] = useStoredRates()
  const [error, setError] = useState<string | null>(null)

  // Seção avançada (opcional — o default é o comparativo simples de 2 cenários):
  // parcelamento COM entrada, partindo do caixa que o usuário tem hoje.
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [availableCash, setAvailableCash] = useState(0) // 0 = usa o valor à vista
  const [downPayment, setDownPayment] = useState(0)
  const [downCount, setDownCount] = useState(10)
  const [downAmount, setDownAmount] = useState(0)

  const simulation = useSimulatePurchaseDecision()

  // Aritmética de exibição imediata (permitida no front); a simulação é do backend.
  const totalInstallments = installmentAmount * installmentsCount
  const nominalDiff = totalInstallments - cashPrice

  const advancedValid =
    downPayment > 0 && downPayment < cashPrice && downAmount > 0 && downCount >= 2 && downCount <= 72

  const canSimulate =
    cashPrice > 0 &&
    installmentAmount > 0 &&
    installmentsCount >= 2 &&
    installmentsCount <= 72 &&
    toScenarios(rates).length > 0 &&
    (!advancedOpen || advancedValid)

  function toDownPaymentPlan(): DownPaymentPlanInput | undefined {
    if (!advancedOpen || !advancedValid) return undefined
    return {
      availableCash: availableCash > 0 ? availableCash : null, // null = tenho o valor à vista
      downPayment,
      installmentsCount: downCount,
      installmentAmount: downAmount,
    }
  }

  function setScenario(kind: ScenarioKind, patch: Partial<StoredRates[ScenarioKind]>) {
    setRates({ ...rates, [kind]: { ...rates[kind], ...patch } })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canSimulate) return
    try {
      await simulation.mutateAsync({
        title: title.trim(),
        cashPrice,
        installmentsCount,
        installmentAmount,
        scenarios: toScenarios(rates),
        downPaymentPlan: toDownPaymentPlan(),
      })
    } catch (err) {
      if (isAppError(err) && err.displayable) {
        setError(err.message)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    }
  }

  const result = simulation.data

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-c-border bg-c-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="dec-title">Compra (opcional)</Label>
            <Input
              id="dec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Notebook"
              maxLength={150}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dec-cash">Valor à vista</Label>
            <MoneyInput id="dec-cash" value={cashPrice} onValueChange={setCashPrice} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <Label htmlFor="dec-count">Nº de parcelas</Label>
            <Input
              id="dec-count"
              type="number"
              min={2}
              max={72}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dec-installment">Valor da parcela</Label>
            <MoneyInput
              id="dec-installment"
              value={installmentAmount}
              onValueChange={setInstallmentAmount}
              className={`${inputCls} mt-1`}
            />
          </div>
        </div>

        {totalInstallments > 0 && cashPrice > 0 && (
          <p className="mt-3 text-sm text-c-text-2">
            Total parcelado: <span className="font-medium text-c-text">{formatCurrency(totalInstallments)}</span>
            {' · '}
            {nominalDiff > 0 ? (
              <>
                juros embutidos nominais de{' '}
                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(nominalDiff)}</span>
              </>
            ) : nominalDiff < 0 ? (
              <>
                desconto nominal de{' '}
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(-nominalDiff)}
                </span>
              </>
            ) : (
              'mesmo total do à vista ("sem juros")'
            )}
          </p>
        )}

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-c-text-2">
            Onde o dinheiro ficaria investido enquanto paga as parcelas
          </legend>
          <p className="mt-1 text-xs text-c-text-3">
            "% do CDI" é o <span className="font-medium">rendimento contratado</span> do investimento
            (ex.: CDB que rende 110% do CDI) — <span className="font-medium">não é imposto</span>. O IR é
            aplicado automaticamente sobre o rendimento pela tabela regressiva (22,5% até 6 meses · 20%
            até 1 ano · 17,5% até 2 anos · 15% depois); para LCI/LCA, marque "Isento de IR".
          </p>
          <div className="mt-2 space-y-2">
            {SCENARIO_KINDS.map((kind) => {
              const sc = rates[kind]
              return (
                <div key={kind} className="flex flex-wrap items-center gap-3 rounded-md border border-c-border p-2">
                  <label className="flex w-24 items-center gap-2 text-sm font-medium text-c-text">
                    <input
                      type="checkbox"
                      checked={sc.enabled}
                      onChange={(e) => setScenario(kind, { enabled: e.target.checked })}
                    />
                    {SCENARIO_KIND_LABELS[kind]}
                  </label>
                  <label className="flex items-center gap-1 text-sm text-c-text-2">
                    Taxa anual
                    <MoneyInput
                      value={sc.rateBps}
                      onValueChange={(v) => setScenario(kind, { rateBps: v })}
                      disabled={!sc.enabled}
                      className={`${inputCls} h-8 w-24`}
                      aria-label={`Taxa anual ${SCENARIO_KIND_LABELS[kind]}`}
                    />
                    %
                  </label>
                  {kind === 'cdi' && (
                    <label className="flex items-center gap-1 text-sm text-c-text-2">
                      % do CDI
                      <MoneyInput
                        value={sc.cdiPercentBps}
                        onValueChange={(v) => setScenario(kind, { cdiPercentBps: v })}
                        disabled={!sc.enabled}
                        className={`${inputCls} h-8 w-24`}
                        aria-label="Percentual do CDI"
                      />
                      %
                    </label>
                  )}
                  {/* % do CDI ≠ 100 muda muito o resultado: mostra a taxa efetiva
                      para um valor acidental (ex.: 27,50%) saltar aos olhos. */}
                  {kind === 'cdi' && sc.enabled && sc.cdiPercentBps !== 10000 && sc.rateBps > 0 && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      = {formatBps(Math.round((sc.rateBps * sc.cdiPercentBps) / 10000))} a.a. efetivos
                    </span>
                  )}
                  <label className="flex items-center gap-1 text-sm text-c-text-2">
                    <input
                      type="checkbox"
                      checked={sc.taxExempt}
                      onChange={(e) => setScenario(kind, { taxExempt: e.target.checked })}
                      disabled={!sc.enabled}
                    />
                    Isento de IR (LCI/LCA)
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>

        {/* Avançado (opcional): parcelamento COM entrada — vira comparativo de 3
            caminhos. O default continua o modo simples de 2 cenários. */}
        <div className="mt-4 rounded-md border border-c-border">
          <label className="flex cursor-pointer items-center gap-2 p-3 text-sm font-medium text-c-text">
            <input
              type="checkbox"
              checked={advancedOpen}
              onChange={(e) => setAdvancedOpen(e.target.checked)}
            />
            Comparar também parcelamento com entrada (3 caminhos)
          </label>
          {advancedOpen && (
            <div className="border-t border-c-border p-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="adv-cash">Tenho disponível hoje</Label>
                  <MoneyInput
                    id="adv-cash"
                    value={availableCash}
                    onValueChange={setAvailableCash}
                    className={`${inputCls} mt-1`}
                  />
                  <p className="mt-1 text-xs text-c-text-3">Deixe 0,00 se tem o valor à vista.</p>
                </div>
                <div>
                  <Label htmlFor="adv-down">Entrada</Label>
                  <MoneyInput
                    id="adv-down"
                    value={downPayment}
                    onValueChange={setDownPayment}
                    className={`${inputCls} mt-1`}
                  />
                </div>
                <div>
                  <Label htmlFor="adv-count">Nº de parcelas (com entrada)</Label>
                  <Input
                    id="adv-count"
                    type="number"
                    min={2}
                    max={72}
                    value={downCount}
                    onChange={(e) => setDownCount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="adv-amount">Valor da parcela (com entrada)</Label>
                  <MoneyInput
                    id="adv-amount"
                    value={downAmount}
                    onValueChange={setDownAmount}
                    className={`${inputCls} mt-1`}
                  />
                </div>
              </div>
              {downPayment > 0 && downAmount > 0 && (
                <p className="mt-2 text-xs text-c-text-2">
                  Total com entrada:{' '}
                  <span className="font-medium text-c-text">
                    {formatCurrency(downPayment + downAmount * downCount)}
                  </span>{' '}
                  (entrada + {downCount}x)
                </p>
              )}
              {advancedOpen && !advancedValid && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Preencha entrada (menor que o valor à vista), parcelas (2–72) e valor da parcela.
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4">
          <Button type="submit" disabled={!canSimulate || simulation.isPending}>
            <Calculator size={16} />
            {simulation.isPending ? 'Simulando…' : 'Simular'}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-c-border bg-c-surface p-4">
            <p className="text-base font-semibold text-c-text">{result.summary}</p>
            <p className="mt-2 text-sm text-c-text-2">
              Juros embutidos no parcelamento (taxa implícita):{' '}
              <span className="font-medium text-c-text">
                {formatBps(result.implicitMonthlyRateBps)} a.m. ({formatBps(result.implicitAnnualRateBps)} a.a.)
              </span>
              {' — '}é a régua líquida: rendimento <em>líquido</em> acima dela favorece parcelar.
            </p>
            {result.breakEvenGrossAnnualRateBps > 0 && (
              <p className="mt-1 text-sm text-c-text-2">
                Régua para investimento tributado (break-even bruto):{' '}
                <span className="font-medium text-c-text">
                  {formatBps(result.breakEvenGrossAnnualRateBps)} a.a.
                </span>
                {' — '}precisa render <em>bruto</em> acima disso para o parcelamento valer.
              </p>
            )}
            <p className="mt-2 text-xs text-c-text-3">
              Como calculamos: 1ª parcela em {result.assumptions.firstInstallmentMonths} mês; mês ≈{' '}
              {result.assumptions.monthDays} dias para o IR ({result.assumptions.irTable}); IOF ignorado
              (resgates a partir de 30 dias); aportes do bolso somados nominalmente.
            </p>
          </div>

          {/* O grid só divide quando há mais de um cenário — 1 cenário ocupa a
              largura toda; 3 colunas só em telas bem largas (2xl), para o extrato
              mês a mês caber sem scroll horizontal. */}
          <div
            className={cn(
              'grid gap-4',
              result.scenarios.length === 2 && 'lg:grid-cols-2',
              result.scenarios.length >= 3 && 'lg:grid-cols-2 2xl:grid-cols-3',
            )}
          >
            {result.scenarios.map((sc) => (
              <ScenarioResultCard key={sc.kind} scenario={sc} />
            ))}
          </div>

          {result.threeWay && <ThreeWayComparison threeWay={result.threeWay} />}

          <div className="rounded-lg border border-c-border bg-c-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-c-text">Evolução do saldo investido</h3>
            <BalanceChart scenarios={result.scenarios} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  `/parcelamentos?novo=1&titulo=${encodeURIComponent(result.title)}&parcelas=${result.installmentsCount}&valor=${result.installmentAmount}&avista=${result.cashPrice}`,
                )
              }
            >
              <CreditCard size={16} />
              Vou parcelar
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/lancamentos?novo=1&titulo=${encodeURIComponent(result.title)}&valor=${result.cashPrice}`)
              }
            >
              <Wallet size={16} />
              Vou pagar à vista
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
