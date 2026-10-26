#!/usr/bin/env python3
"""Junta as fontes em index.html, o app que se abre no navegador.

As páginas (P_*.html) e os scripts (J_*.js) são copiados para dentro do index.html:
- var P={...}: o HTML de cada página, pela chave (index.html, web.html, contador.html, contador-app.html);
- ,J={...}: o texto de cada script, pelo nome que a página referencia (nucleo.js, ui.js, ...).

O loader do próprio index.html escolhe a página pelo aparelho e troca <script src="x.js"> pelo texto de J[x.js].
Rode na raiz do repositório: python3 build.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = {
    'index.html': 'P_index.html',
    'web.html': 'P_web.html',
    'contador.html': 'P_contador.html',
    'contador-app.html': 'P_contador-app.html',
}
SCRIPT_REF = re.compile(r'<script src="([a-z-]+\.js)"></script>')


def ler(nome):
    with open(os.path.join(ROOT, nome), encoding='utf-8') as f:
        return f.read()


def codifica(obj):
    # "</" vira "<\/" para o texto não fechar o <script> que o envolve
    return json.dumps(obj, ensure_ascii=False).replace('</', '<\\/')


def main():
    pages = {chave: ler(arq) for chave, arq in PAGES.items()}
    refs = set()
    for html in pages.values():
        refs.update(SCRIPT_REF.findall(html))
    scripts = {}
    for nome in sorted(refs):
        fonte = 'J_' + nome
        if not os.path.exists(os.path.join(ROOT, fonte)):
            sys.exit('build: falta a fonte ' + fonte + ' para ' + nome)
        scripts[nome] = ler(fonte)

    saida = ler('index.html')
    ini = saida.find('var P=')
    if ini < 0:
        sys.exit('build: index.html não tem o mapa de páginas (var P=)')
    decoder = json.JSONDecoder()
    _, fim_p = decoder.raw_decode(saida, ini + len('var P='))
    if saida[fim_p:fim_p + 3] != ',J=':
        sys.exit('build: o mapa de scripts (,J=) não está logo depois de P')
    _, fim_j = decoder.raw_decode(saida, fim_p + len(',J='))
    novo = saida[:ini] + 'var P=' + codifica(pages) + ',J=' + codifica(scripts) + saida[fim_j:]
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(novo)
    print('build: index.html gerado (%d páginas, %d scripts)' % (len(pages), len(scripts)))


if __name__ == '__main__':
    main()
