import type { Dispatch } from 'react';
import type { DomainKey, WorldConfig } from '../domain/types';
import type { ConfigAction } from '../state/config';
import { DOMAIN_PRESETS } from '../domain/config';
import { useI18n } from '../i18n/I18nContext';
import { DomainSection } from './DomainSection';
import { RangeField, SelectField, NumberField, Toggle } from '../lib/inputs';
import { NeighborsEditor } from './NeighborsEditor';
import { ResourceEditor } from './ResourceEditor';
import { SupportEditor } from './SupportEditor';
import { ScheduleEditor } from './ScheduleEditor';

interface Props {
  config: WorldConfig;
  dispatch: Dispatch<ConfigAction>;
}

const d = (max: number, min = 1) => min + Math.floor(Math.random() * (max - min + 1));

export function ConfigPanel({ config, dispatch }: Props) {
  const { t, scale } = useI18n();
  const set = (path: string, value: unknown) => dispatch({ type: 'setField', path, value });
  const opts = (ns: string, values: string[]) =>
    values.map((v) => ({ value: v, label: t(`${ns}.${v}`) }));
  // mission presets are named by the goal itself; the rest use presetNames.*
  const presetOpts = (domain: DomainKey) =>
    Object.keys(DOMAIN_PRESETS[domain]).map((id) => ({
      value: id,
      label: domain === 'mission' ? t(`mission.${id}`) : t(`presetNames.${id}`),
    }));
  const onPreset = (domain: DomainKey) => (presetId: string) =>
    dispatch({ type: 'applyPreset', domain, presetId });

  const randomizeFounders = () => {
    set('founders.count', 5 * d(60, 2));
    set('founders.health', d(5));
    set('founders.dependentsPct', 5 * d(11, 1));
    set('founders.skill', d(5));
    set('founders.medianAge', 18 + d(30));
  };

  const balanceWord =
    config.arcana.balance < 35 ? '⚙ ' + config.arcana.balance : config.arcana.balance > 65 ? '✦ ' + config.arcana.balance : '⚖ 50/50';

  return (
    <aside className="controls">
      <h1>{t('app.title')}</h1>
      <div className="sub">{t('app.subtitle')}</div>

      <DomainSection title={t('domains.world')} defaultOpen>
        <NumberField label={t('fields.seed')} value={config.seed} onChange={(v) => set('seed', v)} />
        <RangeField label={t('fields.horizon')} value={config.horizonYears} min={20} max={400} step={10} onChange={(v) => set('horizonYears', v)} />
        <Toggle label={t('fields.shocks')} checked={config.shocksEnabled} onChange={(v) => set('shocksEnabled', v)} />
      </DomainSection>

      <DomainSection title={t('domains.geography')} presetOptions={presetOpts('geography')} onPreset={onPreset('geography')} defaultOpen>
        <SelectField label={t('fields.biome')} value={config.geography.biome} options={opts('biome', ['plains', 'forest', 'desert', 'hills', 'mountains', 'wetland', 'tundra'])} onChange={(v) => set('geography.biome', v)} />
        <SelectField label={t('fields.water')} value={config.geography.water} options={opts('water', ['none', 'river', 'lake', 'coast', 'rivermouth'])} onChange={(v) => set('geography.water', v)} />
        <SelectField label={t('fields.road')} value={config.geography.road} options={opts('road', ['isolated', 'track', 'minor_road', 'highway', 'crossroads'])} onChange={(v) => set('geography.road', v)} />
        <RangeField label={t('fields.ruggedness')} value={config.geography.ruggedness} min={1} max={5} labels={scale('scales.ruggedness')} onChange={(v) => set('geography.ruggedness', v)} />
      </DomainSection>

      <DomainSection title={t('domains.geology')} presetOptions={presetOpts('geology')} onPreset={onPreset('geology')}>
        <RangeField label={t('fields.fertility')} value={config.geology.fertility} min={1} max={5} labels={scale('scales.fertility')} onChange={(v) => set('geology.fertility', v)} />
        <RangeField label={t('fields.stability')} value={config.geology.stability} min={1} max={5} labels={scale('scales.stability')} onChange={(v) => set('geology.stability', v)} />
        <ResourceEditor config={config} dispatch={dispatch} />
      </DomainSection>

      <DomainSection title={t('domains.climate')} presetOptions={presetOpts('climate')} onPreset={onPreset('climate')}>
        <RangeField label={t('fields.temperature')} value={config.climate.temperature} min={1} max={5} labels={scale('scales.temperature')} onChange={(v) => set('climate.temperature', v)} />
        <RangeField label={t('fields.rainfall')} value={config.climate.rainfall} min={1} max={5} labels={scale('scales.rainfall')} hint={t('hints.rainfall')} onChange={(v) => set('climate.rainfall', v)} />
        <RangeField label={t('fields.growingSeason')} value={config.climate.growingSeason} min={1} max={5} labels={scale('scales.growingSeason')} hint={t('hints.growingSeason')} onChange={(v) => set('climate.growingSeason', v)} />
        <div className="editor-label">{t('hazards.label')}</div>
        <Toggle label={t('hazards.winters')} checked={config.climate.hazards.winters} onChange={(v) => set('climate.hazards.winters', v)} />
        <Toggle label={t('hazards.storms')} checked={config.climate.hazards.storms} onChange={(v) => set('climate.hazards.storms', v)} />
        <Toggle label={t('hazards.droughts')} checked={config.climate.hazards.droughts} onChange={(v) => set('climate.hazards.droughts', v)} />
      </DomainSection>

      <DomainSection title={t('domains.founders')} presetOptions={presetOpts('founders')} onPreset={onPreset('founders')} defaultOpen>
        <RangeField label={t('fields.count')} value={config.founders.count} min={5} max={500} step={5} onChange={(v) => set('founders.count', v)} />
        <SelectField label={t('fields.species')} value={config.founders.species} options={opts('species', ['human', 'elf', 'dwarf', 'halfling', 'orc'])} onChange={(v) => set('founders.species', v)} />
        <RangeField label={t('fields.health')} value={config.founders.health} min={1} max={5} labels={scale('scales.health')} hint={t('hints.health')} onChange={(v) => set('founders.health', v)} />
        <RangeField label={t('fields.dependentsPct')} value={config.founders.dependentsPct} min={0} max={60} suffix="%" hint={t('hints.dependentsPct')} onChange={(v) => set('founders.dependentsPct', v)} />
        <NumberField label={t('fields.medianAge')} value={config.founders.medianAge} min={10} onChange={(v) => set('founders.medianAge', v)} />
        <RangeField label={t('fields.skill')} value={config.founders.skill} min={1} max={5} labels={scale('scales.skill')} hint={t('hints.skill')} onChange={(v) => set('founders.skill', v)} />
        <button className="mini add" onClick={randomizeFounders}>
          {t('actions.randomize')}
        </button>
      </DomainSection>

      <DomainSection title={t('domains.wildlife')} presetOptions={presetOpts('wildlife')} onPreset={onPreset('wildlife')}>
        <RangeField label={t('fields.game')} value={config.wildlife.game} min={1} max={5} labels={scale('scales.game')} onChange={(v) => set('wildlife.game', v)} />
        <RangeField label={t('fields.predators')} value={config.wildlife.predators} min={0} max={5} labels={scale('scales.threat')} onChange={(v) => set('wildlife.predators', v)} />
        <RangeField label={t('fields.monsters')} value={config.wildlife.monsters} min={0} max={5} labels={scale('scales.threat')} onChange={(v) => set('wildlife.monsters', v)} />
        <RangeField label={t('fields.aggression')} value={config.wildlife.aggression} min={0} max={5} labels={scale('scales.threat')} onChange={(v) => set('wildlife.aggression', v)} />
      </DomainSection>

      <DomainSection title={t('domains.neighbors')}>
        <NeighborsEditor config={config} dispatch={dispatch} />
      </DomainSection>

      <DomainSection title={t('domains.polity')} presetOptions={presetOpts('polity')} onPreset={onPreset('polity')}>
        <SelectField label={t('fields.sovereignty')} value={config.polity.sovereignty} options={opts('sovereignty', ['independent', 'vassal', 'colony', 'protectorate'])} onChange={(v) => set('polity.sovereignty', v)} />
        <RangeField label={t('fields.borderProximity')} value={config.polity.borderProximity} min={1} max={5} labels={scale('scales.borderProximity')} onChange={(v) => set('polity.borderProximity', v)} />
        <RangeField label={t('fields.polStability')} value={config.polity.stability} min={1} max={5} labels={scale('scales.authority')} onChange={(v) => set('polity.stability', v)} />
        <RangeField label={t('fields.taxBurden')} value={config.polity.taxBurden} min={0} max={5} labels={scale('scales.tax')} onChange={(v) => set('polity.taxBurden', v)} />
      </DomainSection>

      <DomainSection title={t('domains.mission')} presetOptions={presetOpts('mission')} onPreset={onPreset('mission')} defaultOpen>
        <SelectField label={t('fields.goal')} value={config.mission.goal} options={opts('mission', ['new_nation', 'frontier_town', 'resource_extraction', 'military_outpost', 'stop_nomads', 'religious_haven', 'trade_hub'])} onChange={(v) => set('mission.goal', v)} />
        <NumberField label={t('fields.targetPopulation')} value={config.mission.targetPopulation} min={10} step={50} onChange={(v) => set('mission.targetPopulation', v)} />
        <NumberField label={t('fields.horizonYears')} value={config.mission.horizonYears} min={5} step={5} onChange={(v) => set('mission.horizonYears', v)} />
      </DomainSection>

      <DomainSection title={t('domains.support')} presetOptions={presetOpts('support')} onPreset={onPreset('support')}>
        <SupportEditor config={config} dispatch={dispatch} />
      </DomainSection>

      <DomainSection title={t('domains.arcana')} presetOptions={presetOpts('arcana')} onPreset={onPreset('arcana')}>
        <RangeField label={t('fields.magic')} value={config.arcana.magic} min={0} max={5} labels={scale('scales.magic')} onChange={(v) => set('arcana.magic', v)} />
        <RangeField label={t('fields.balance')} value={config.arcana.balance} min={0} max={100} display={balanceWord} onChange={(v) => set('arcana.balance', v)} />
      </DomainSection>

      <DomainSection title={t('domains.schedule')}>
        <ScheduleEditor config={config} dispatch={dispatch} />
      </DomainSection>
    </aside>
  );
}
