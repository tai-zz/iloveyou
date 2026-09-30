# Publicar no GitHub Pages

O repositorio ja esta pronto e comitado. Faltam dois passos, que precisam
da sua conta do GitHub.

## 1. Criar o repositorio

Em https://github.com/new — vazio, **sem** README, sem .gitignore, sem licenca.
Anote o nome que escolher.

## 2. Mandar o codigo

Trocando `SEU-USUARIO` e `NOME-DO-REPO`:

    git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
    git push -u origin master

Na primeira vez o Windows abre uma janela do GitHub pedindo login. O envio
sao ~360 MB, entao demora um pouco dependendo da sua subida.

## 3. Ligar o Pages

No repositorio: **Settings > Pages**.
Em *Source* escolha **Deploy from a branch**; em *Branch*, **master** e pasta
**/ (root)**. Salve.

Em um a dois minutos o endereco aparece nessa mesma tela, no formato:

    https://SEU-USUARIO.github.io/NOME-DO-REPO/

## Coisas que valem saber

- O `.nojekyll` na raiz existe pra o Pages servir os arquivos como estao, sem
  passar pelo Jekyll.
- O `media/aot.mp4` tem 66,6 MB. Passa no limite de 100 MB por arquivo, mas o
  GitHub avisa que e grande. O site inteiro da 277 MB, dentro do limite de
  1 GB do Pages.
- A senha do portao e do lado do navegador: ela esta em `js/main.js` e os
  arquivos de `media/` abrem direto pelo endereco, sem passar por ela. Num
  site publico isso vale como porta simbolica, nao como tranca.
