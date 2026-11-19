import { parseGuideContent } from './educational-content.mapper';

describe('parseGuideContent', () => {
  it('splits the standard headings into steps, why recycle and impact', () => {
    const sections = parseGuideContent(
      [
        '## Como descartar',
        '1. Guarde em pote seco.',
        '2. Leve a um ponto de coleta.',
        '',
        '## Por que reciclar',
        'Metais pesados contaminam o solo.',
        '',
        '## Impacto ambiental',
        'Mercúrio é **bioacumulativo**.',
      ].join('\r\n'),
    );

    expect(sections).toEqual({
      howToDispose: ['Guarde em pote seco.', 'Leve a um ponto de coleta.'],
      whyRecycle: 'Metais pesados contaminam o solo.',
      environmentalImpact: 'Mercúrio é bioacumulativo.',
      body: '',
    });
  });

  it('accepts headings written differently, as the web panel allows', () => {
    const sections = parseGuideContent(
      '# Passo a passo\n- Lave a embalagem\n* Seque\n### Porque reciclar?\nEconomiza energia.',
    );

    expect(sections.howToDispose).toEqual(['Lave a embalagem', 'Seque']);
    expect(sections.whyRecycle).toBe('Economiza energia.');
  });

  it('keeps free text and unknown sections in the body, so nothing is lost', () => {
    const sections = parseGuideContent(
      'Introdução ao tema.\n\n## Curiosidades\nUma pilha dura anos.\n- item solto',
    );

    expect(sections.howToDispose).toEqual([]);
    expect(sections.body).toBe(
      'Introdução ao tema.\nCuriosidades\nUma pilha dura anos.\n• item solto',
    );
  });
});
