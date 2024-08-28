// define function which accepts body and cheerio as args
function extract(html, cheerio) {
    // return object with extracted values              
    const $ = cheerio.load(html);
    let topDiv = null;

    // Replace all doubled-up <BR> tags with <P> tags, and remove fonts.
    $('body').html($('body').html().replace(/<br\s*\/?>[\r\n\s]*<br\s*\/?>/g, '</p><p>').replace(/<\/?font[^>]*>/g, ''));

    // Create elements to hold the article content, title, and footer
    const articleContent = $('<div></div>');
    const articleTitle = $('<h1></h1>').text($('title').text());
    
    //articleContent.append(articleTitle);


    // Helper functions used for cleaning the content

function cleanStyles(node) {
  node.find('*').each(function () {
      $(this).removeAttr('style');
  });
}

function killDivs(node) {
  node.find('div').each(function () {
      const $this = $(this);
      const p = $this.find('p').length;
      const img = $this.find('img').length;
      const li = $this.find('li').length;
      const a = $this.find('a').length;
      const embed = $this.find('embed').length;

      if ($(this).text().split(',').length - 1 < 10 && (img > p || li > p || a > p || p == 0 || embed > 0)) {
          $this.remove();
      }
  });
}

function killBreaks(node) {
  node.html(node.html().replace(/(<br\s*\/?>(\s|&nbsp;?)*){1,}/g, '<br />'));
}

function clean(node, tag, minWords) {
  minWords = minWords || 1000000;
  node.find(tag).each(function () {
      if ($(this).text().split(' ').length < minWords) {
          $(this).remove();
      }
  });
  return node;
}

    // Study all the paragraphs and find the chunk that has the best score
    $('p').each(function () {
        const parentNode = $(this).parent();

        if (typeof parentNode.data('readability') === 'undefined') {
            parentNode.data('readability', { contentScore: 0 });

            if (parentNode.attr('class') && parentNode.attr('class').match(/(comment|meta|footer|footnote)/)) {
                parentNode.data('readability').contentScore -= 50;
            } else if (parentNode.attr('class') && parentNode.attr('class').match(/((^|\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\s|$))/)) {
                parentNode.data('readability').contentScore += 25;
            }

            if (parentNode.attr('id') && parentNode.attr('id').match(/(comment|meta|footer|footnote)/)) {
                parentNode.data('readability').contentScore -= 50;
            } else if (parentNode.attr('id') && parentNode.attr('id').match(/^(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)$/)) {
                parentNode.data('readability').contentScore += 25;
            }
        }

        if ($(this).text().length > 10) {
            parentNode.data('readability').contentScore++;
        }

        parentNode.data('readability').contentScore += $(this).text().split(',').length - 1;
    });

    // Find the top scoring element
    $('*').each(function () {
        const node = $(this);
        if (typeof node.data('readability') !== 'undefined' && (topDiv == null || node.data('readability').contentScore > topDiv.data('readability').contentScore)) {
            topDiv = node;
        }
    });

    if (topDiv == null) {
        topDiv = $('<div></div>').html('Sorry, no content found');
    }

    // Clean styles, kill unnecessary divs, breaks, and other elements
    cleanStyles(topDiv);
    killDivs(topDiv);
    killBreaks(topDiv);

    topDiv = clean(topDiv, "form");
    topDiv = clean(topDiv, "object");
    topDiv = clean(topDiv, "table", 250);
    topDiv = clean(topDiv, "h1");
    topDiv = clean(topDiv, "h2");
    topDiv = clean(topDiv, "iframe");

    // Append the topDiv and footer to the article content
    articleContent.append(topDiv);

    return {
      title: articleTitle.text().trim(),
      article:articleContent.text().trim()
  };
}
