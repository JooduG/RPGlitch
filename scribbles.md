```html
<h1>📚 Perchance Tutorial</h1>

<main>
  <p>Perchance is all about lists. You simply create lists of different things and then reference the lists from one another. For example, we could create a list of animals, and a list of sentences, and then use the animals list <i>within</i> the sentences list like so:</p>

  <pre>
animal
	pig
	cow
	zebra

sentence
	That \[animal\] is very sneaky.
	I befriended a wild \[animal\] yesterday.
</pre
  >

  <p>
    Pretty easy, right? In each sentence, <code>\[animal\]</code> gets replaced by a random item from the animal list. As you can see, list items are indented from the list name. You must use <b>one tab</b> or <b>two spaces</b> to indent your list items. <a href="/3d174opr#edit">Here's a link</a> to
    a Perchance generator based on the above example. Try adding some items and playing around with it.
  </p>

  <p>Note that <i>visual</i> aspect of a Perchance generator is <i>completely</i> customisable, and there are many <a href="templates">templates</a> (like <a href="little-story-template">this one</a>, for example) which you can use to make a nice-looking generator, fast.</p>

  <p>We could easily add another list to our previous example called "adjective" and then use <code>\[adjective\]</code> within our sentences to make them more random and complex:</p>

  <pre>
...

adjective
  sneaky
  happy
  furry
  
sentence
  That \[animal\] is very \[adjective\].
	I befriended a very \[adjective\] \[animal\] yesterday.
</pre
  >

  <p>We could also create another list called "paragraph" like so:</p>

  <pre>
paragraph
	\[sentence\] \[sentence\] \[sentence\]
</pre
  >

  <p>
    Here we've made a list called "paragraph" that has a single item. That item is made of 3 sentences separated by spaces. We could have different sentence types, and arrange them in different ways and thus have multiple items in our paragraph list, but for our simple demonstration we only need one
    item - and this item will always be chosen when <code>\[paragraph\]</code> is used. Perchance actually has a nice shortcut for single-item lists:
  </p>

  <pre>
paragraph = \[sentence\] \[sentence\] \[sentence\]
</pre
  >

  <p>
    There's no need to use this short-hand method now, but as we build more complex generators you'll see that it can come in handy to neaten up our code. There are also some important differences between these two different ways of creating a "single-item list", and you'll learn about them further
    along in this tutorial.
  </p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">Side Note <span style="opacity:0.5;">(click me)</span></summary>
    <p>If you want to put a space before or after an item, you need to use a special character pair, <code>\\s</code>, at the start and/or end of your item. For example:</p>

    <pre>
my_list
	\\s    this item has some space on either side    \\s
	\\s  this one just has some space at the start
	this one just has some space on the end         \\s
</pre
    >

    <p>
      When the engine outputs this text, the <code>\\s</code> bits will be replaced with a space. If you wanted an item called "My Item Text" with just one space on either side you would write <code>\\sMy Item Text\\s</code>. The reason we need to use <code>\\s</code> for spaces on either side of
      items is because Perchance "takes indentation seriously". If you put spaces at the start of your item, Perchance will think you're trying to indent the item further. As you'll learn soon, Perchance allows you to use multiple levels/tiers of indentation (you can create a hierarchy of lists
      within lists), which means we need strict indentation rules. Regarding normal spaces at the <i>end</i> of items, Perchance will trim them off (ignore them) during initialization.
    </p>

    <p>
      If you'd like to put a "tab" character in your items, you can use <code>\\t</code>. As you can see, backslash is a special character in Perchance. If you want to use an <i>actual</i> backslash, then you need to write a double backslash like this: <code>\\\\</code>. Similarly, if you want to
      use a literal square bracket or equals sign, then you need to put a backslash before them like this: <code>\\\[</code> and this: <code>\\\=</code>. That way the Perchance engine will just treat it like a normal text character. The backslash is a magical character that you'll use quite often in
      your random-generator-building career.
    </p>
  </details>

  <h2 id="probability">Probability</h2>
  <p>So you can see that Perchance is all about lists of items, and random selections of those items. But what if we want certain items in a list to be more likely than others? Let's imagine we're building a "random meal generator". Here's a basic version of how it might look:</p>

  <pre>
description
	It's a \[adjective\] dish with \[type\] \[main\].
	The \[adjective\] \[main\] is paired with a \[size\] serving of \[condiment\]-covered \[side\].
	A \[main\] with a bit of \[condiment\] and some \[adjective\] \[side\] on the side.

adjective
	vegan
	Indonesian
	Italian
	delicious

main
	risotto
	pie
	stir-fry
	curry

side
	bowl of rice
	salad
	fries
	fried mushrooms
	pumpkin soup
	
type
	a \[size\] serving of
	well-cooked
	unusually fresh
	roasted

size
	small
	large
	tiny

condiment
	pepper
	salt
	chilli flakes
	oregano
</pre
  >

  <p>This generator would probably produce nonsense, but that's okay - it's just to demonstrate some concepts. Now, how do we make some items more common than others? For example, what if we wanted "pepper" to be twice as likely as the other condiments? Here's how you'd do that:</p>

  <pre>
condiment
	pepper ^2
	salt
	chilli flakes
	oregano
</pre
  >

  <p>
    This "up arrow" character (above number 6 on your keyboard) allows you to change the likelihood that an item will be selected. <code>^2</code> makes it twice as likely, <code>^100</code> makes it 100 times more likely compared to the others. All items have a default odds of <code>1</code> - you
    can imagine that each item has <code>^1</code> after it by default. You can also make an item less likely:
  </p>

  <pre>
condiment
	pepper ^2
	salt
	chilli flakes ^0.1
	oregano
</pre
  >

  <p>
    This makes "chilli flakes" quite unlikely, especially compared to pepper. In this example pepper is 20 times more likely than chilli flakes. And salt is 10 times more likely than chilli flakes. Makes sense? The number after the <code>^</code> is the item's "odds" or "weight" during the random
    selection process. You can use fractions like <code>^1/10</code> instead of <code>^0.1</code> if that's easier for you.
  </p>

  <p>That's a brief overview of the probability notation in Perchance. There's much more to explore in this area but we'll get to that later in the tutorial.</p>

  <h2 id="shorthand_lists">Shorthand Lists</h2>

  <p>Sometimes you'll just want to randomly choose between a few items, and creating a whole list just for that isn't desirable. In this case we can use some "curly bracket" shorthand notation:</p>

  <pre>
sentence
	That's a \{very|extremely\} \{tiny|small\} \[animal\]!
	I \{think|believe\} that you are a \{liar|thief\}.
	I'd be so \{rich|poor\} if not for that person.
</pre
  >

  <p>
    See how that works? Inside the curly brackets, you separate items with a vertical bar (or "pipe") character, which you can find near the curly brackets keys on most keyboards. When the Perchance engine "evaluates" the text it replaces the "curly block" with a randomly selected item from within
    that block. It's essentially a way to embed "mini lists" within an item.
  </p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">What does "evaluate" mean? <span style="opacity:0.5;">(click me)</span></summary>
    <p>Throughout this tutorial I use the words "evaluate", "resolve", and "execute" in sentences like these:</p>
    <ul>
      <li>Perchance <i>evaluates</i> <code>\{dog|cat\}</code>, replacing it with either 'dog' or 'cat'.</li>
      <li>The Perchance engine <i>resolves</i> <code>\[plant\]</code>, replacing it with a random item from the <code>plant</code> list.</li>
      <li>Perchance <i>executes</i> the square block, <code>\[food\]</code>, which outputs a random food item.</li>
    </ul>
    <p>
      All three of these words are basically interchangable - they mean the same thing. When I write "evaluate", "resolve" or "execute", I'm referring to Perchance converting text with square and curly brackets into "plain" text (i.e. text <i>without</i> any curly/square brackets) by randomly
      selecting items from lists and short-hand (within curly brackets) lists according to the odds that you have specified. So whenever you see "evaluate", "resolve" or "execute", just mentally replace that with "convert into plain text by making the appropriate random selections".
    </p>
    <p>Here are a few more examples of their usage in case it's helpful:</p>
    <ul>
      <li><code>\{dog|cat\}</code> <i>resolves</i> into 'dog' or 'cat'.</li>
      <li>If we <i>evaluate</i> <code>\[flower\]</code>, then we'll get something like "tulip".</li>
      <li><i>Execution</i> of square blocks happens in the order in which they appear in your text.</li>
    </ul>
  </details>

  <p>Just as we can change the likelihood of normal list items, so we can change the likelihood of shorthand "curly" list items. Given the curly block: <code>\{big|large|massive\}</code>, we can make "large" 3 times as likely by writing: <code>\{big|large^3|massive\}</code>.</p>

  <p>You might have guessed already, but we can do stuff like this too:</p>
  <pre>The country is known to contain many species of \{\[animal\]|\[plant\]\}</pre>
  <p>Here we've put square blocks <i>inside</i> a curly block, so half the time it'll choose a random animal, and the other half of the time it'll choose a random plant.</p>

  <p>
    Note that <span style="text-decoration:underline;">spaces matter in curly blocks</span>, so <code>\{hi|hello\}</code> is <b>different</b> to <code>\{ hi | hello \}</code>. In <i>square</i> blocks, spaces are ignored. So <code>\[animal\]</code> is the <b>same</b> as <code>\[ animal \]</code> -
    they output exactly the same thing, despite the extra spaces inside the brackets.
  </p>

  <p>
    Curly blocks are used for all sorts of other fancy tricks in Perchance. Take this sentence, for example: <code>I'm a \[animal\]</code>. If the result of <code>\[animal\]</code> happens to start with a vowel, then the grammar won't be right: <code>I'm a antelope</code> - it should be
    <code>I'm <b>an</b> antelope</code>. We could manually fix this by having two separate lists of animals (ones that need "a" and ones that need "an"), but that'd be a pain. Instead we can just do this: <code>I'm \{a\} \[animal\]</code>. By using the <code>\{a\}</code> curly block, the correct
    article (a/an) will be chosen based on what is appropriate for the next word.
  </p>

  <p>
    Here's another curly block: <code>\{s\}</code>. What does it do? Let's see with an example. Take the following sentence: <code>I have \{1|2|3\} bananas</code>. You can see the problem here: "I have 2 bananas." makes sense, but "I have 1 bananas." doesn't. You can see that we need a way to
    intelligently decide whether a word should be pluralised. Here's how we do it: <code>I have \{1|2|3\} banana\{s\}</code>, and there you have it!
  </p>

  <p>
    Instead of writing <code>\{1|2|3\}</code>, we can write <code>\{1-3\}</code>. This is especially handy for much larger number ranges like<code>\{1-500\}</code>. You can also choose a random letter with the same notation. <code>\{a-z\}</code> chooses a random lower case letter.
    <code>\{a-f\}</code> chooses a random lower case letter between "a" and "f". This also works for upper case letters: <code>\{A-Z\}</code>.
  </p>

  <h2 id="properties">Properties</h2>

  <p>As we've learned, a square bracket "block" like <code>\[animal\]</code> chooses a random item from the "animal" list. But square blocks have more tricks up their sleeves. Consider the following example:</p>

  <pre>
animal
	pig
	zebra
	cow

sentence
	There are so many \[animal\] here.
	I've befriended this \[animal\].
	\[animal\] are very agile.
</pre
  >

  <p>
    In this example, <code>\[sentence\]</code> would evaluate to something like: "There are so many cow here." - which obviously isn't correct. It should be "There are so many <b>cows</b> here." So, what do we do? Change our "animal" list so they're all plurals? But then the second sentence wouldn't
    work - it needs singular words. Luckily we can convert items to plural form easily: <code>\[animal.pluralForm\]</code>. Yep, it's that easy. Just put a period (a dot) and then "pluralForm" after the name of the list. So our new "sentences" list becomes:
  </p>

  <pre>
sentence
	There are so many \[animal.pluralForm\] here.
	I've befriended this \[animal\].
	\[animal.pluralForm\] are very agile.
</pre
  >

  <p>
    So now our pluralisation problem is fixed - but we're not quite done. The last item in our list has the "animal" block at the start and so ideally it'd be capitalised. Here's how we do that: <code>\[animal.pluralForm.titleCase\]</code>. Notice that we can string together multiple "properties" by
    joining them with a period (dot) character. Here are some more properties to try out:
  </p>

  <ul style="text-align:left;">
    <li>singularForm</li>
    <li>pastTense</li>
    <li>presentTense</li>
    <li>futureTense</li>
    <li>upperCase</li>
    <li>lowerCase</li>
    <li>sentenceCase</li>
    <li>titleCase</li>
  </ul>

  <p>
    There are more properties, but these simple ones should suffice for basic generators. We'll learn about more powerful and interesting properties further on in this tutorial. Also, please note that the <code>singularForm</code>, <code>pluralForm</code>, <code>pastTense</code>,
    <code>presentTense</code> and <code>futureTense</code> properties <b>may not work properly for all words</b> (especially rare ones). In cases where 100% accuracy is required, it's best to create separate lists for the plural/past-tense/etc. variations.
  </p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">What about infinitive and gerund tenses? <span style="opacity:0.5;">(click me)</span></summary>
    <p>
      You can use the <a href="/conjugate-plugin" target="_blank">conjugate-plugin</a> for less common tenses like gerund, actor and infinitive. You might also like the <a href="/plural-plugin" target="_blank">plural-plugin</a>, which allows you to add custom plurals, and the
      <a href="/be-plugin" target="_blank">be-plugin</a>, which automatically chooses is/are/was/were based on the preceding pronoun.
    </p>
  </details>

  <h2 id="the_editor">The Editor</h2>

  <p>
    At this point you've got enough knowledge about Perchance to start building basic text generators. There's much more to learn about the language, but let's stop here for a second to learn about the Perchance generator editor. The editor is where you'll be actually be building your generator. It
    includes 4 panels. The layout of the panels in the editor is as follows:
  </p>

  <table class="editor-layout">
    <tbody>
      <tr>
        <td>Lists</td>
        <td>Preview</td>
      </tr>
      <tr>
        <td>Tester</td>
        <td>HTML</td>
      </tr>
    </tbody>
  </table>
  <style>
    table.editor-layout * {
      border: 1px solid #999;
    }
    table.editor-layout {
      width: 300px;
      height: 100px;
      margin: 0 auto;
    }
  </style>

  <p>Let's explain each panel briefly:</p>

  <ul style="text-align:left;">
    <li>
      <b>Lists:</b> You'll spend the majority of your time in this panel writing lists like the examples that you've seen so far. Note that you can also add "comments" in the code panel by writing two forward slashes like this: "// this is a comment" and any text after those two slashes on that line
      will be ignored by the engine. Comments are just a way for you to leave notes for yourself or others within the code of your generator and they won't affect your generator's output. Pro tip: You can highlight multiple lines and indent (i.e. add two spaces before) all those lines at once by
      pressing the <code>Tab</code> to indent and <code>Shift+Tab</code> to un-indent.
    </li>
    <li>
      <b>Tester:</b> This is a helpful little panel that allows you to test out your lists, and general Perchance expressions. If you've just made a list of animals called "animal" then you can type <code>the silly \[animal\]</code> into the tester and it'll evaluate it to "the silly worm" or "the
      silly mouse", etc.
    </li>
    <li>
      <b>HTML:</b> You'll probably want to share your generator with others, so it needs to have a webpage. Webpages are written in a language called "HTML", but don't worry! You don't need to learn HTML or even worry about the HTML panel at all because there are
      <a href="/templates">pre-built templates</a> which you can use. If you'd like to learn HTML so you can customize your generator's appearance a bit more, then <a href="https://www.khanacademy.org/computing/computer-programming/html-css/intro-to-html/v/making-webpages-intro">Khan Academy</a> and
      <a href="https://www.codecademy.com/courses/web-beginner-en-HZA3b/0/1">Code Academy</a> both have great online courses that are free and will get you up and running with HTML in no time at all. You can also use the
      <a href="https://perchance.org/layout-maker-plugin" target="_blank">layout maker plugin</a> to help you design your generator more intuitively, and there's an AI helper in the editor which can create or adjust the HTML for you.
    </li>
    <li>
      <b>Preview:</b> Here's where you get to actually see and test your generator for real. It live-updates as you type so you can test it as you go. You can also disable auto-update and reload your preview manually (there's a checkbox next to the reload button in this panel). There's also a
      "fullscreen" button in the bottom-left of this panel which will take you to your translator's <i>actual</i> webpage so you can copy the link and share it with your pals.
    </li>
  </ul>

  <p>
    If you haven't already, have a play around in the editor for a bit and see what you can make. You can edit and play around with generators but if you'd like to save them you'll be promted to signup/login. You'll need a valid email, but you can always use a service like
    <a href="http://temp-mail.org" rel="nofollow">temp mail</a> if you just want to play around. In any case, Perchance only emails you for verification and password resets (you'll need a real email address to recover your account if you forget the password).
  </p>

  <p>
    You can save your generator by pressing Ctrl+s (Cmd+s on Mac) or by clicking the "save" button at the top of the screen. When you're logged in you'll see a few extra buttons at the top of the editor: a "settings" button which allows you to change the url of your generator (after you've saved
    it), and an "account" button which allows you to see a list of all your generators and change your password/email.
  </p>

  <p>
    Also note the "community" button at the top of the editor - this leads to <a href="https://lemmy.world/c/perchance">lemmy.world/c/perchance</a> which acts as the community forum for Perchance. Feel free to ask questions and share your generator over there (you'll need to login/signup to
    lemmy.world).
  </p>

  <h2 id="storing_text">Storing Text</h2>

  <p>This section is about a fundamental feature of the Perchance engine. It may seem a little strange or confusing, but rest assured that it'll make more sense as we progress. Pay attention for this one! :) Let's start with a very simple example, as usual:</p>

  <pre>
flower
	rose
	lily
	tulip
	
sentence
  Oh you've got me a \[flower\]! Thank you, I love \[flower.pluralForm\].
</pre
  >

  <p>The problem with the above example is that a different flower would likely be selected each time. It'd output something like "Oh, you've got me a lily! Thank you, I love roses!". We'd like to use the same flower choice twice so that our sentence makes sense. Here's how we'd do that:</p>

  <pre>
sentence
  Oh you've got me a \[f = flower.selectOne\]! Thank you, I love \[f.pluralForm\].
</pre
  >

  <p>
    What we're doing here is selecting one item from <code>\[flower\]</code> (e.g. "tulip" or "rose" or "lily") and putting it inside "f" which is like a list with just one item. That's what the equals sign does inside square brackets - it allows you to "store things" under a unique identifier. We
    didn't need to specifically use the letter "f" as our identifier - we can use any name so long as it only has letters and numbers, and doesn't start with a number. Don't worry if this is a little confusing - more examples are coming! And remember that you can always ask questions on the
    <a href="https://lemmy.world/c/perchance">community</a>.
  </p>

  <p>
    Notice that we're putting <code>flower.selectOne</code> into the <code>f</code> identifier but we're also outputting the selected item <b>at the same time</b>. First the engine puts one item from <code>\[flower\]</code> into the <code>\[f\]</code> list, then it outputs that selected item into
    our sentence. In programming lingo we would generally call <code>f</code> a "variable" and we'd say that we "assigned" one item from the flower list to the <code>f</code> variable.
  </p>

  <p>
    <b>Important note:</b> Imagine that the above <code>flower</code> list contained items like <code>\{red|pink\} rose</code> instead of just <code>rose</code>. In that case you should write <code>\[f = flower.selectOne.evaluateItem\]</code>, or simply <code>\[f = flower.evaluateItem\]</code>,
    since <code>evaluateItem</code> automatically executes <code>selectOne</code> behind-the-scenes. We need to use <code>evaluateItem</code> because we want to store something like <code>pink rose</code> in <code>f</code> rather than an "unevaluated" item like <code>\{red|pink\} rose</code>. So we
    make sure we "evaluate" all the random parts like <code>\{red|pink\}</code> before storing the selected item in <code>f</code>.
  </p>

  <p>Here's another example:</p>

  <pre>
name
  Addison
  Alex
  Alexis
  
lastName
	Smith
	Johnson
	Williams

sentence
  Her name was \[n = name.selectOne\]. \[n.titleCase\] \[lastName.titleCase\], if I recall correctly.
</pre
  >

  <p>Remember, spaces are ignored inside square blocks. So <code>\[ v = verb.selectOne \]</code> is the same as <code>\[v=verb.selectOne\]</code> and <code>\[v\]</code> is the same as <code>\[ v \]</code>.</p>

  <p>
    You might be wondering why we can't simply write <code>\[f=flower\]</code>. This is because that would cause <code>f</code> to be a reference to the actual <i>list</i> called "flower", rather than to one randomly selected item of <code>\[flower\]</code>. Just remember: we want to store
    <i>an item</i> of the list, not the list itself. If you actually did write <code>\[f=flower\]</code>, then <code>\[f\]</code> would just be an alias (another name for) <code>\[flower\]</code>, and so <code>\[f\]</code> would return a new random flower each time (this may be a handy thing to know
    in case you want to shorten a list name that you're using lots).
  </p>

  <p>You can change the thing that's stored inside a variable by just assigning it a different value:</p>

  <pre>
sentence
  I think her name was \[n = name.selectOne.titleCase\]? \[n\] \[l = lastName.titleCase\]? Wait, no, it was \[n = name.selectOne\]. Yeah, that's right, \[n\] \[l\].
</pre
  >

  <p><b>Caution:</b> Square brackets should <span style="text-decoration:underline;">not</span> be used inside square brackets:</p>

  <ul>
    <li>This is <b style="color:green">correct</b>: <code>\[n = name.selectOne\]</code></li>
    <li>This is <b style="color:red">incorrect</b>: <code>\[n = \[name\].selectOne\]</code></li>
  </ul>

  <p>
    Both are actually "legal" Perchance code, but the latter isn't doing what you intended, because square brackets have a <b>different meaning</b> when they're used <i>within</i> other square brackets. So for now, just remember: when you're inside square brackets, refer to list names directly -
    don't wrap them in square brackets.
  </p>

  <h2 id="repeating_things">Repeating Things</h2>

  <p>In the last section you learned about the <code>selectOne</code> property. That might have got you thinking: Can I select <i>more than one</i> item? Yes! You can select as many as you like.</p>

  <pre>
character = \{\{a-z\}|\{A-Z\}|\{0-9\}\}
tenCharacters = \[character.selectMany(10)\]
</pre
  >

  <p>
    What's going on here? Well, first, we've nested a bunch of curly blocks to choose a random alphanumeric character. But now we do something new. The <code>selectMany</code> property is like the others we've seen so far except for one glaring difference: It must always be followed by a pair of
    parentheses (normal backets) that have a number inside them. That number specifies how many times we want to pull an item from the <code>\[character\]</code> "list". Here we've chosen to make 10 selections. So now if we evaluate <code>\[tenCharacters\]</code>, it'll result in something like:
    "j63iJY90qm".
  </p>

  <p>Without the <code>selectMany</code> property, we'd need to do something like this:</p>

  <pre>
tenCharacters = \{\{a-z\}|\{A-Z\}|\{0-9\}\}\{\{a-z\}|\{A-Z\}|\{0-9\}\}\{\{a-z\}|\{A-Z\}|\{0-9\}\}.........
</pre
  >

  <p>
    And that wouldn't be fun. You can also select a <i>random</i> number of items as follows: <code>\[character.selectMany(3,10)\]</code>. That'll select a random number of characters between 3 and 10 (inclusive). See how that works? Inside the parentheses we put 2 numbers, separated by a comma -
    the minimum, then the maximum.
  </p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">Side Note <span style="opacity:0.5;">(click me)</span></summary>
    <p>
      A quick side note: In the above example, if you wanted each alphanumeric character to have an equal likelihood of being selected, then you would need to weight each sub-block according to the number of items it has: <code>\{\{a-z\}^26|\{A-Z\}^26|\{0-9\}^10\}</code>. If that doesn't make sense
      to you, don't worry - just remember that you can change the odds of each part of the curly block to suit your needs.
    </p>
  </details>

  <p>
    What if you want to join your selected items with a comma? For example, you might have a <code>\[fruit\]</code> list and you'd like to produce a sentence like: "My favourite fruits are: oranges, mangos, bananas, pears, apples, blueberries and grapes." Here's where we need the
    <code>joinItems</code> property:
  </p>

  <pre>
sentence
  My favourite fruits are: \[fruit.selectMany(5).joinItems(", ")\] and \[fruit\].
</pre
  >

  <p>The <code>joinItems</code> property also requires an input via the use of parentheses. Unlike number-based inputs, text-based inputs must be wrapped in quotation marks. So all <code>.joinItems(", ")</code> does is put <code>, </code>&nbsp;(comma+space) in between each of the 5 items.</p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">Advanced Tip <span style="opacity:0.5;">(click me)</span></summary>
    <p>We use quotation marks around text that we give to the <code>joinItems</code> property, but what if you'd like to use quotation marks within that text? In that case you need to put a backslash character before them. For example:</p>
    <pre>
sentence = My favourite fruits are: "\[fruit.selectMany(2).joinItems("<span style="color:#00bbc4">\", \"</span>")\]" and "\[fruit\]".
</pre>
    <p>
      I've colored text inside the quotes to try to make it less visually confusing. All it's doing is putting <code>", "</code> (quotes <i>included</i>) in-between each of our 3 randomly selected fruits, so it'd result in something like: My favourite fruits are: "grapes", "bananas" and "plums".
    </p>
    <p>Quotes are a special character inside square blocks, and so we need to put a backslash before them whenever we want to use them in their "literal"/textual sense.</p>
  </details>

  <p>We could also select a random number of items like this:</p>

  <pre>
num = \{3-6\}
sentence
  My favourite fruits are: \[fruit.selectMany(num).joinItems(", ")\] and \[fruit\].
</pre
  >

  <p>
    Pretty cool, hey? In case you missed it, we're defining <code>\[num\]</code> as a random number between 3 and 6, and then we're using that random number as the input to the <code>selectMany</code> property. Note that there are <b>not</b> any square brackets around <code>num</code>. That's
    because <i>we're already inside square brackets</i>, so we can reference lists <i>by their plain old names</i>. Note also that we <b>cannot</b> put curly bracket blocks directly inside square blocks <i>unless they are enclosed in quotation marks</i>. If you stick around for the advanced tutorial
    you can learn why (hint: curly brackets have a different meaning when they're inside square brackets). Worth repeating yet again: When inside square brackets you should reference lists directly by their name, rather than putting square brackets around their name.
  </p>

  <p>A reminder: You should name your lists only with letters, numbers and underscores. Your list names shouldn't contain spaces, and shouldn't start with a number. Also, list names are case-sensitive. Your list <i>items</i>, on the other hand, can contain any text at all.</p>

  <p>Pro tip: If you want to join <i>all</i> the items in your list together (in the order you've defined them), you can just do this: <code>\[fruit.joinItems(", ")\]</code>. This can come in handy sometimes for defining "multi-line items".</p>

  <p>
    This "fruits" example is a good illustration of where we'd really like each selected item to be different to the others. We don't want something like: "My favourite fruits are: grapes, grapes, pears, …" So how do we prevent this sort of thing from occuring? This is where
    <code>selectUnique</code> comes in handy. <code>selectUnique</code> is just like <code>selectMany</code>, except that it never selects the same item twice:
  </p>

  <pre>
sentence
  My favourite fruits are \[fruit.selectUnique(3).joinItems(", ")\].
</pre
  >

  <p>
    Simple, right? But notice that <code>\[sentence\]</code> will result in something like "My favourite fruits are grapes, blueberries, watermelon." when ideally we'd like it to be more gramatically correct: "My favourite fruits are grapes, blueberries <b>and</b> watermelon." It's evident that
    we'll often need a more powerful approach to selecting unique items from a list, and that's exactly what the next section is about.
  </p>

  <h2 id="unique_selections">Unique Selections</h2>

  <p>
    As we saw in the last section, we sometimes want random selections that aren't the same as previous selections. The <code>selectUnique</code> function is just like <code>selectMany</code>, except that it won't choose the same item from the list twice. <code>\[animal.selectUnique(5)\]</code> will
    select 5 unique items from the list called "animal". <code>\[animal.selectUnique(3,20)\]</code> will select a random number of animals between 3 and 20.
  </p>

  <p>
    But sometimes the <code>selectUnique</code> function is a little too simplistic. What if we want to spread our unique selections throughout a paragraph of text, rather than just selecting a big list of them all at once? This is where a "consumable list" comes in handy. When you randomly select
    an item from a <i>consumable</i> list, that item disappears from the list and cannot be chosen again - the item is "consumed". Creating a consumable list is pretty easy. We just take a normal list that we've made, and add the "consumableList" command: <code>\[cl = animal.consumableList\]</code>.
    We've now created <code>\[cl\]</code>, which is a <b>consumable</b> list of animals. It's a completely separate (consumable) copy of the original. Whenever <code>\[cl\]</code> is evaluated, it outputs an animal, and removes that animal from the "cl" list so that next time <code>\[cl\]</code> is
    evaluated it definitely wont output that animal again. Let's look at an example:
  </p>

  <pre>
topic
  trans rights
	animal rights
	science
	mathematics
	...

sentence
  She mostly writes about \[t = topic.consumableList\] and \[t\].
</pre
  >

  <p>
    So far we've seen properties like <code>selectOne</code> (which grabs a random item from the list) and <code>pluralForm</code> (which grabs a random item from the list and pluralizes it). The <code>consumableList</code> property actually creates an exact copy of the whole list, but alters this
    new list so that when we select items from it, those items are removed and cannot be chosen again. So <code>\[t = topic.consumableList\]</code> copies the whole <code>\[topic\]</code> list, makes it "consumable", and then makes it accessible via <code>\[t\]</code>.
  </p>

  <p>
    As well as creating a consumable list called <code>t</code>, the code <code>\[t = topic.consumableList\]</code> also outputs (and consequently "consumes") the first item from that <code>t</code> list. So in the above example <code>\[sentence\]</code> would output something like: "She mostly
    writes about science and trans rights." What if you want to create a consumable list, but not yet output the first item? That's explained in the "<i>Commas In Square Blocks</i>" section below (spoiler: you'd just write <code>\[t = topic.consumableList, ""\]</code>).
  </p>

  <p>Here's a more complex example for you to think about. We want to select two random non-duplicate things she writes about, and then re-use the second one in a follow-on sentence.</p>

  <pre>
sentence
  She mostly writes about \[t = topic.consumableList\] and \[a = t.selectOne\]. Her last post was about \[a\].
</pre
  >

  <p>
    Can you see what's happening there? We make a consumable list called <code>t</code> and output the first item at the same time, then we get the second item and put it in a 1-item list called <code>a</code>, and output that item at the same time. Then we use <code>a</code> again for the third
    selection. So we end up with a sentence like "She mostly writes about mathematics and animal rights. Her last post was about animal rights." The last two topics are the same and they're different to the first one.
  </p>

  <details style="padding:1rem; margin-top: 1rem;">
    <summary style="cursor:pointer;">Side note <span style="opacity:0.5;">(click me)</span></summary>
    <p>
      You might be wondering why we need to write <code>\[a = t.selectOne\]</code> instead of just <code>\[a = t\]</code>? The answer is that <code>\[a = t\]</code> would make <code>a</code> a direct reference to the whole <code>t</code> list, rather than a <i>specific, randomly-chosen item</i> from
      <code>t</code>. So <code>\[a = t\]</code> would mean that writing <code>\[a\]</code> would then be the same as writing <code>\[t\]</code> - they'd be the same thing. We write <code>\[a = t.selectOne\]</code> to select a random item from <code>t</code> and put it in <code>a</code> so we can use
      it again later.
    </p>
    <p>
      But then, when you write <code>\[t\]</code>, why doesn't it output the <i>whole</i> list? The answer is that Perchance "sneakily" does a behind-the-scenes <code>selectOne</code> on the output of square blocks so that Perchance code is "neater" to write. I.e. so you can write
      <code>\[t\]</code> instead of <code>\[t.selectOne\]</code>. This, unfortunately, can lead to the above confusion. But hopefully this explanation clears things up!
    </p>
  </details>

  <p>This is a lot to take in, so don't worry if you don't understand it perfectly. Just keep playing around with generators and looking at the source code of other peoples' text generators and you'll soon start to pick up these more advanced techniques.</p>

  <h2 id="commas_in_square_blocks">Commas In Square Blocks</h2>

  <p>Commas have a special meaning <i>within square blocks</i>. They allow you to execute multiple actions at once:</p>
  <pre>\[a=animal.selectOne, b=a.pastTense, c=a.futureTense\]</pre>
  <p>Only the <b>last</b> item gets actually displayed, but the first two get executed "behind the scenes".</p>

  <p>If you'd like to execute a list of actions and output <i>nothing</i>, then just make the last item in the list a pair of empty quotes:</p>
  <p></p>
  <pre>\[a=animal.selectOne, ""\]</pre>
  <p>You can put text inside those quotes if you'd like to output something specific:</p>
  <pre>\[a=animal.selectOne, "blah blah blah"\]</pre>
  <p>and that's just the same as writing this:</p>
  <pre>\[a=animal.selectOne, ""\]blah blah blah</pre>

  <h2 id="basic_html">Bolding, Underlining, Etc.</h2>

  <p>In the example below, we're making the word "compassion" bold:</p>

  <pre>Kindness and &lt;b&gt;compassion&lt;/b&gt; are underrated.</pre>

  <p>That looks like this:</p>

  <p style="background-color:#efefef; background-color:light-dark(#efefef, #333); padding:1rem; border:1px solid lightgrey; border:1px solid light-dark(lightgrey,#878787);">Kindness and <b>compassion</b> are underrated.</p>

  <p>So to make some text <b>bold</b>, just put <code>&lt;b&gt;</code> at the start, and <code>&lt;/b&gt;</code> at the end of it.</p>
  <p>And to make some text <i>italic</i>, put <code>&lt;i&gt;</code> at the start, and <code>&lt;/i&gt;</code> at the end of it.</p>
  <p>And to <u>underline</u> some text, put <code>&lt;u&gt;</code> at the start, and <code>&lt;/u&gt;</code> at the end of it.</p>
  <p>And to <s>strike through</s> some text, put <code>&lt;s&gt;</code> at the start, and <code>&lt;/s&gt;</code> at the end of it.</p>

  <p>
    By the way, these things (that start with <code>&lt;something&gt;</code> and end with <code>&lt;/something&gt;</code>) are called HTML "tags". So you've just learned some of the basics of the HTML language. All the web pages on the internet are built using HTML. The other two languages used by
    web pages are CSS and JavaScript.
  </p>

  <p>If you want to add a new line (break some text into a second line), just add <code>&lt;br&gt;</code> wherever you want to <b>br</b>eak the text, like so:</p>

  <pre>Kindness and compassion&lt;br&gt;are underrated.</pre>
  <p style="background-color:#efefef; background-color:light-dark(#efefef, #333); padding:1rem; border:1px solid lightgrey; border:1px solid light-dark(lightgrey,#878787);">Kindness and compassion<br />are underrated.</p>

  <p>You can add multiple <code>&lt;br&gt;</code> tags to break your text up into paragraphs, like so:</p>

  <pre>My first paragraph.&lt;br&gt;&lt;br&gt;My second paragraph.</pre>
  <p style="background-color:#efefef; background-color:light-dark(#efefef, #333); padding:1rem; border:1px solid lightgrey; border:1px solid light-dark(lightgrey,#878787);">My first paragraph.<br /><br />My second paragraph.</p>

  <p>
    Not too difficult, right? There's lots more to learn about HTML over at the (completely free) <a href="https://www.khanacademy.org/computing/computer-programming/html-css" target="_blank">Khan Academy HTML+CSS course</a>. If you want to learn more about how to customize your generator, I highly
    recommend it!
  </p>

  <p>Tip: Let's say one your lists has a single item that is really long, like this:</p>

  <pre>
listWithOneLongItem
  This is a really long line. This is the second sentence of the really long line. And this is the third sentence. And this is the fourth sentence. And this is the fifth sentence.
</pre
  >

  <p>To make it easier to read and edit, you either click the "wrap" button in the top-right of the editor, or you can separate your single item into several items and then add <code>$output = \[this.joinItems(" ")\]</code> as the first item of this list, like this:</p>

  <pre>
listWithOneLongItem
  $output = \[this.joinItems(" ")\]
  This is a really long line.
  This is the second sentence of the really long line.
  And this is the third sentence.
  And this is the fourth sentence.
  And this is the fifth sentence.
</pre
  >

  <p>Adding that special <code>$output = ...</code> item to the list causes <code>\[listWithOneLongItem\]</code> to output all the items joined together instead of a random item.</p>
  <p>If you want each sentence to be displayed on its own line, then just change this part: <code>joinItems(" ")</code> to this: <code>joinItems("&lt;br&gt;")</code>. So we join the items together with line <b>br</b>eaks instead of spaces.</p>

  <details style="padding:1rem;">
    <summary style="cursor:pointer;">Bonus: Adding links to other web pages <span style="opacity:0.5;">(click me)</span></summary>
    <p>You can create a link to another generator, or to a completely different website like this:</p>
    <pre>Hi there, <span style="opacity:0.6">&lt;a href="https://example.com"&gt;</span>click here<span style="opacity:0.6">&lt;/a&gt;</span> to visit my blog!</pre>
    <p>and that will display like this:</p>
    <p style="background-color:#efefef; background-color:light-dark(#efefef, #333); padding:1rem; border:1px solid lightgrey; border:1px solid light-dark(lightgrey,#878787);">Hi there, <a href="https://example.com">click here</a> to visit my blog!</p>
    <p>If you want to make it so clicking the link opens a new tab, rather than going directly to the new page in the current tab, you just need to add the <code>target="_blank"</code> attribute to your <code>&lt;a&gt;</code> tag, like this:</p>
    <pre>Hi there, <span style="opacity:0.6">&lt;a href="https://example.com" target="_blank"&gt;</span>click here<span style="opacity:0.6">&lt;/a&gt;</span> to visit my blog!</pre>
  </details>

  <details style="padding:1rem; margin-top: 1rem;">
    <summary style="cursor:pointer;">Bonus: Adding multiple spaces in a row <span style="opacity:0.5;">(click me)</span></summary>
    <p>HTML is a bit weird in some aspects: If you add multiple spaces between words, it ignores the extra spaces by default. So if you write this:</p>

    <pre>Kindness and compassion         are underrated.</pre>
    <p>then by default it'll come out like this:</p>
    <p style="padding:1rem; border:1px solid lightgrey;">Kindness and compassion are underrated.</p>

    <p>So what do you do if you want multiple spaces? Well, you need to use this weird bunch of characters: <code>&amp;nbsp;</code> (which stands for "non-breaking space"), like this:</p>
    <pre>Kindness and compassion &amp;nbsp;&amp;nbsp;&amp;nbsp;&amp;nbsp;&amp;nbsp;&amp;nbsp; are underrated.</pre>
    <p style="background-color:#efefef; background-color:light-dark(#efefef, #333); padding:1rem; border:1px solid lightgrey; border:1px solid light-dark(lightgrey,#878787);">Kindness and compassion &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; are underrated.</p>
    <p>I know, it's weird. I'm sorry about that! One alternative is to wrap your output (in the HTML panel - the bottom-right editor) in a <code>&lt;p&gt;</code> tag with a special style attribute like this:</p>
    <pre>&lt;p style="white-space:pre-wrap;"&gt;\[output\]&lt;/p&gt;</pre>
    <p>And now you can use multiple spaces like normal - no need for the <code>&amp;nbsp;</code> stuff.</p>
    <p>If your <code>\[output\]</code> is currently wrapped in a <code>&lt;p&gt;</code> tag that has an existing <code>style</code> "attribute", like this, for example:</p>
    <pre>&lt;p style="margin:1em auto; padding:0 1em; max-width:700px;"&gt;\[output\]&lt;/p&gt;</pre>
    <p>Then you can just add the <code>white-space:pre-wrap;</code> at the end of the style attribute like this:</p>
    <pre>&lt;p style="margin:1em auto; padding:0 1em; max-width:700px; white-space:pre-wrap;"&gt;\[output\]&lt;/p&gt;</pre>
  </details>

  <h2 id="hierarchical_lists">Hierarchical Lists</h2>

  <p>Perchance allows you to create "lists of lists" by indenting your items appropriately. This may seem unusual at first, but as you explore Perchance's more advanced features you'll see that it can sometimes be useful. Here's an example of a multi-level list called "animal":</p>

  <pre>
animal
	mammal
		kangaroo
		pig
		human
	reptile
		lizard
		crocodile
		turtle
	insect
		spider
		beetle
		ant
</pre
  >

  <p>The result of <code>\[animal\]</code> will be "mammal", "reptile" or "insect" with equal likelihood (since we haven't added any likelihood indicators on those items). The result of <code>\[animal.mammal\]</code> will be either "kangaroo", "pig" or "human", with equal likelihood.</p>

  <p>
    What do you think <code>\[animal.selectOne\]</code> will result in? Remember that <code>animal</code> is a list ... <i>of lists</i> - so when we <code>selectOne</code> item from <code>animal</code> we get a random <i>list</i>. So when we write <code>\[animal.selectOne\]</code>, it'll essentially
    give us either <code>\[animal.mammal\]</code>, <code>\[animal.reptile\]</code> or <code>\[animal.insect\]</code>, all with equal probability.
  </p>

  <p>Thus, both these lines are equivalent:</p>

  <pre>
\[animal.selectOne\]
\{\[animal.mammal\]|\[animal.reptile\]|\[animal.insect\]\}
</pre
  >

  <p>
    That can be a bit confusing since it may initially seem like <code>\[animal.selectOne\]</code> would simply result in "mammal" or "reptile" or "insect" - but that's not the case, since those items are themselves <i>lists</i>, and so <code>selectOne</code> gives us <i>the whole sublist</i>, which
    then resolves to a single item from that sublist. So the result of <code>\[animal.selectOne\]</code> would be either <i>kangaroo, pig, human, lizard, crocodile, turtle, spider, beetle, or ant</i> - all with equal likelihood, since we haven't altered the odds of the sublists and they all have the
    have the same number of items.
  </p>

  <p>Perchance allows you to nest items to an arbitrary depth. You could, for example, have a nested list which has many levels: <code>\[planet.country.town.house.room\]</code>.</p>

  <p>You can also use hierarchical lists for stuff like this:</p>

  <pre>
race
	dwarf
		height = \{7-15\}0cm
		name = Dwarf
		type
			Mountain Dwarf
			Aleithian Dwarf
	elf
		height = \{12-20\}0cm
		name = Elf
		type
			High Elf
			Night Elf
	...

output
  Yes, a \[r = race.selectOne, r.name\] of that description passed through here several months ago. \{A\} \[r.type\] if I recall correctly. About \[r.height\] tall.
</pre
  >

  <p>And if for some reason we specifically wanted a random dwarf height then we could write <code>\[race.dwarf.height\]</code>.</p>

  <p>
    If you're a bit confused by all this hierarchical stuff, don't worry about it - for the vast majority of generators top-level lists will be completely fine. It's only if you're building somewhat complicated generators that nesting will start to become useful to help organize and compartmentalize
    our code. Remember that you can always ask questions in our <a href="https://lemmy.world/c/perchance">friendly community</a>.
  </p>

  <p>If you'd like to learn more about hierarchical stuff check out the <a href="/advanced-tutorial">advanced tutorial</a> and the <a href="/examples">examples</a> page.</p>

  <h2 id="importing_exporting">Importing and Exporting</h2>

  <p>
    I'm glad you've made it this far! In this section we're going to learn how you can use Perchance generators that you or others have made <i>inside</i> your generators. If you use Perchance long enough, you'll probably find that there are certain lists which you use quite often. These lists can
    be separated into their own generators and "imported" with a simple statement when needed.
  </p>

  <p>Each generator on Perchance has a unique name that you can see in the url: "perchance.org/<b>name</b>" You can import other generators using their name. Let's import the <a href="/noun">perchance.org/noun</a> generator:</p>

  <pre>
sentence = The \{import:noun\} is sitting on my \{import:noun\}.
</pre
  >

  <p>
    That'd result in something silly like "The brick is sitting on my cloud." There are pre-existing generators for a huge variety of topics. You can check out the <a href="/useful-generators">useful generators</a> list and also the <a href="https://lemmy.world/c/perchance">Perchance community</a>.
    If you create any generators that you think would be useful to others, please share them on on the community page! Sharing is caring :)
  </p>

  <p>In the example above, what if you want to get the <code>pluralForm</code> of an imported noun? In that case you can do this:</p>

  <pre>
noun = \{import:noun\}
sentence = The \[noun.pluralForm\] are sitting on my \[noun\].
</pre
  >

  <p>We've put the imported noun generator into its own <code>\[noun\]</code> list which we can then treat like any other list. You can use these curly import blocks wherever you use text. Here we've made a list out of a bunch of import statements:</p>

  <pre>
livingThing
	\{import:animal\}
	\{import:plant\}
	\{import:bacteria\}
</pre
  >

  <p>Often you'll want to import a specific list from <i>within</i> another generator. Let's imagine there's a generator called <code>animal-lists</code> with this code:</p>
  <pre>
mammal
	kangaroo
	pig
	human
	
reptile
	lizard
	crocodile
	turtle
	
insect
	spider
	beetle
	ant
</pre
  >
  <p>If you write <code>\{import:animal-lists\}</code> then you'll get "mammal" or "reptile" or "insect" as the output. That's probably not what we wanted. We want to be able to grab a random reptile, or a random insect - not a random animal "type". Here's how we do this:</p>

  <pre>
animalLists = \{import:animal-lists\}
sentence
  That's definitely not \{a\} \[animalLists.mammal\]. It's \{a\} \[animalLists.reptile\].
	\{A\} \[animalLists.insect\] is much smaller than a \{a\} \[animalLists.mammal\].
</pre
  >

  <p>Makes sense? We're just treating <code>\[animalLists\]</code> as if it's a list that we've defined in our code; we can access sub-lists, use <code>pluralForm</code>, <code>consumableList</code>, and any other properties that we desire.</p>

  <p>
    In the above example, what if you were the owner of the <code>animal-lists</code> generator and you wanted to make it so that if people write <code>\{import:animal-lists\}</code>, then they get a random animal instead of a random animal type? To do that, we need to add a special
    <code>$output</code> list:
  </p>

  <pre>
$output
	\[mammal\]
	\[reptile\]
	\[insect\]
</pre
  >

  <p>So now when they write <code>\{import:animal-lists\}</code>, the output will be a random item from whatever we've put in this <code>$output</code> list.</p>

  <p>When sharing your generator, it's a good idea to give it a nice name. You can change your generator's name by clicking the "settings" button in the bar at the top of the editor.</p>

  <p>Here's another example of how to use the special <code>$output</code> list:</p>

  <pre>
$output = \[description\]

adjective
	narrow
	sturdy
	...
	
thing
	chest
	cloak
	...

description
	It's \{a\} \[adjective\] \[thing\] that looks about \{10-70\} years old.
	...
</pre
  >

  <p>
    Since we added the <code>$output</code> property, when people import our generator they'll get a random <code>\[description\]</code>. If we don't include an <code>$output</code> property, then the importer would get "adjective", "thing" or "description" - i.e. the name of one of our top-level
    lists. That's because the list names in your generator are actually themselves <i>items</i> within the "root" list. If that's confusing, don't worry, it's not super important, but the above "Hierarchical Lists" section gives some more info on why this is the case. The main thing to understand is
    that you should make a top-level <code>$output</code> property that equals the list that you want importers to get when they import your generator. If you want to export <i>all</i> your lists, then you don't need to add a top-level <code>$output</code> property - Perchance assumes that by
    default.
  </p>

  <h2 id="or_operator">The "or" Operator</h2>

  <p>Have a look at this simple generator and see if you can work out what's happening:</p>

  <pre>
output
  \{A\} \[a = animal.selectOne\] is covered in \[a.body || "fur"\].

animal
  bird
    body = feathers
  lizard
    body = scales
  dog
	cat
	moose
	...
</pre
  >

  <p>
    Notice this new <code>||</code> thing? That means <b>or</b>. So writing <code>a.body || "fur"</code> is like saying "Output <code>a.body</code>, <b>or if it doesn't exist</b>, then <code>"fur"</code>". So if <code>a.body</code> doesn't exist (like it wouldn't if <code>a</code> was
    <code>dog</code>, <code>cat</code> or <code>moose</code>), then "fur" is returned as a backup. But why do we need quotation marks around "fur"? That's because we're telling Perchance that we're referring to the literal characters "fur" and not a list or variable called <code>fur</code>.
  </p>
  <p>
    What's the purpose of all this? Well, if our <code>animal</code> list is quite long, and most of them have fur covering their bodies, then it'd be neater if we could specify a "default" value for the <code>a.body</code> property. The <code>||</code> operator is great for situations like this
    where we want there to be a default or backup value.
  </p>

  <p>Instead of using "fur" as a backup, we could use a variable or list:</p>

  <pre>
defaultBody = fur
output
  \{A\} \[a = animal.selectOne\] is covered in \[a.body || defaultBody\].
...
</pre
  >

  <p>And you can chain together multiple defaults like this: <code>\[a || b || c || ...\]</code>, and the first one that exists will be output.</p>

  <h2 id="equals_sign">The Equals Sign</h2>

  <p>At the start of the tutorial, I said that you can use the "equals" sign as a way to make single-item lists easier to write:</p>

  <pre>
veg1 = \{celery|spinach\}
veg2
  \{celery|spinach\}
</pre
  >

  <p>It's easier and neater to have things like this in one line, like we've done with <code>veg1</code>. But it's time to talk about some important differences between these two ways of writing a "single-item list".</p>

  <p>
    Firstly, what happens when we write <code>\[v = veg2.selectOne\]</code>? What gets stored in <code>v</code>? What gets output by the square block? Well, remember that <code>selectOne</code> is just a special command that selects one item from the list. And we can see that <code>veg2</code> only
    has one item: <code>\{celery|spinach\}</code>, so <code>veg2.selectOne</code> will always result in <code>\{celery|spinach\}</code>. That's what will get stored in <code>v</code>. So whenever we write <code>\[v\]</code>, we'll get either "celery" or "spinach" with a 50% probability each.
  </p>

  <p>
    All good so far? This is just the normal behavior of <code>selectOne</code> when we apply it to a list. A common rookie mistake here is to think that either "celery" or "spinach" would be stored in <code>v</code>, but that's not how <code>selectOne</code> works. It just selects a random item
    from your list - it doesn't "evaluate" that item to produce "plain" text like "celery" or "spinach". That's why <code>\[v\]</code> randomly outputs either "celery" or "spinach" each time, instead of always outputting the same one.
  </p>

  <p>
    Now, remember, when we assign a value to a variable in a square block (like so: <code>\[v = veg2.selectOne\]</code>), that value will also be <i>outputted</i> by the block. So the block will output <code>\{celery|spinach\}</code> (the value we stored in <code>v</code>). Before displaying the
    output of a square block on the page, Perchance <i>always fully evaluates it</i> so that it's just plain text (no square or curly brackets). So the block outputs <code>\{celery|spinach\}</code>, and then Perchance randomly evaluates it into either "celery" or "spinach" before displaying it on
    the page. So we know that our block, <code>\[v = veg2.selectOne\]</code>, will output either "celery" or "spinach", and that we've stored <code>\{celery|spinach\}</code> in <code>v</code>.
  </p>

  <p>
    Okay, now let's look at <code>veg1</code> and how it differs. <code>veg1</code> is actually a <i>direct reference</i> to <code>\{celery|spinach\}</code>. It's not a list. So when we write <code>veg1.selectOne</code>, we're applying <code>selectOne</code> directly to
    <code>\{celery|spinach\}</code>, which is an inline list. So <code>veg1.selectOne</code> will result in either "celery" or "spinach", each with equal likelihood. So if you write <code>\[v = veg1.selectOne\]</code>, then <code>v</code> contains <i>either</i> "celery" <b>or</b> "spinach".
  </p>

  <p>So, in the example below, can you predict what <code>output1</code> and <code>output2</code> will look like?</p>

  <pre>
veg1 = \{celery|spinach\}
veg2
  \{celery|spinach\}
	
output1
  \[v = veg1.selectOne\] \[v\] \[v\] \[v\]
output2
  \[v = veg2.selectOne\] \[v\] \[v\] \[v\]
</pre
  >

  <p>
    The answer is that <code>output1</code> will be either "celery celery celery celery" or "spinach spinach spinach spinach", whereas <code>output2</code> will be something like "celery spinach spinach celery" or "spinach spinach celery spinach" - i.e. <code>v</code> in
    <code>output2</code> contains <code>\{celery|spinach\}</code> so it'll be random each time, whereas in <code>output1</code>, <code>v</code> either contains "celery" <b>or</b> "spinach".
  </p>

  <p>
    The key understanding here is that <code>veg1</code> <i>isn't actually a list</i> at all. It's a direct reference to <code>\{celery|spinach\}</code>. So in this case <code>veg1</code> is basically equivalent to <code>veg2.selectOne</code> since they both refer to <code>\{celery|spinach\}</code>
  </p>

  <p>
    You don't need to worry about the difference between these two cases if you're not using <code>selectOne</code> and assigning the result to a variable (like <code>v</code> in the above examples. That's because Perchance will always fully evaluate \[veg1\] and \[veg2\] into either "celery" or
    "spinach" if you just write them in a square block like that.
  </p>

  <p>What if you had a list like <code>veg2</code> but you wanted to store either "celery" or "spinach" in <code>v</code> instead of storing <code>\{celery|spinach\}</code>? In that case you can just write <code>\[v = veg2.selectOne.selectOne\]</code>.</p>

  <h2 id="evaluateItem">The <code>evaluateItem</code> Command</h2>

  <p>Let's say you had this code:</p>

  <pre>
output
  \[f = fruit.selectOne\]?! \[f\] is way too many!

fruit
  \{10-20\} apples
  \{30-70\} pears
</pre
  >

  <p>
    You want it to output a sentence like "<i>50 pears?! 50 pears is way too many!</i>", but instead this generator will output something like "<i>13 apples?! 16 apples is way too many!</i>". That's because <code>fruit.selectOne</code> will result in either <code>\{10-20\} apples</code> or
    <code>\{30-70\} pears</code> with equal likelihood, so one of those will get stored in <code>f</code>. So let's say <code>\{10-20\} apples</code> was selected and stored in <code>f</code>. When <code>\{10-20\} apples</code> gets "evaluated", we get a specific bit of text like "12 apples" or "15
    apples".
  </p>

  <p>But of course, we want <code>f</code> to always output the same thing - so how do we store a specific <i>evaluated</i> version of the item, instead of the actual item itself? This is where the <code>evaluateItem</code> command comes in handy:</p>

  <pre>
output
  \[f = fruit.selectOne.evaluateItem\]?! \[f\] is way too many!
</pre
  >

  <p>
    See what's happening there? First we <i>select one</i> item from the <code>fruit</code> list, then we <i>evaluate</i> the selected item, then we store the result in <code>f</code>. So now the result of <code>\[output\]</code> will be something like "<i>50 pears?! 50 pears is way too many!</i>" -
    just like we wanted.
  </p>

  <h2 id="dynamic_odds">A Taste of Dynamic Odds</h2>
  <p>
    You've seen how to change the probability of items in a list, and you've seen how to store your random selections in a variable (so you can use them again later) - now we're going to see how to combine those two features. This is a fairly deep topic, and it's important for building complex
    generators, but I'm only giving you a small taste here. Don't worry if you don't fully understand what's going. To get a full explanation, head over to the "Dynamic Odds" section on the <a href="https://perchance.org/examples" target="_blank">examples</a> page.
  </p>
  <p>
    Okay, so what if you wanted to change the probability of an item in one list <i>based on</i> an item that we've previously selected from another list? To do that, we need to use "dynamic odds" - they're "dynamic" because these odds can <i>change</i> depending on what we've stored in variables.
  </p>
  <p>Here's a simple example where we are randomly selecting a score (a number between 1 and 4), and then we're choosing an adjective <i>based on</i> the score that we selected:</p>
  <pre>
score = \{1-4\}

output
  Your score is \[s = score.selectOne\] which is \[adjective\]!
  
adjective
  not great ^\[s == 1\]
  good ^\[s == 2\]
  great ^\[s > 2\]
</pre
  >
  <p>
    The square brackets around our odds values means that they're dynamic. That is, they're re-computed every time we select an item from the <code>adjective</code> list. The odds of each item is based on the value that's currently stored in <code>s</code>. The <code>==</code> part means "is equal
    to", so <code>^\[s == 1\]</code> means "only allow this item to be selected if <code>s</code> is equal to 1". The <code>&gt;</code> symbol means "is greater than". There are lots of other symbols that you can learn in the "Dynamic Odds" section on the
    <a href="https://perchance.org/examples" target="_blank">examples</a> page.
  </p>
  <p>Here's another example. Let's say we first want to select a color, and then select a more specific version of that original color. We want the output to be something like "The dragon's scales were blue. More specifically, navy blue." Here's how we could do that:</p>

  <pre>
output
  The dragon's scales were \[c = color.selectOne\]. More specifically, \[shade.selectOne\].

color
  blue
  red
  green
  yellow

shade
  blue ^\[c == "blue"\]
    cyan
    navy blue
    teal
    turquoise
  red ^\[c == "red"\]
    maroon
    cherry
  ...
</pre
  >
  <p>
    See what's happening there? We're first randomly selecting an item from the <code>color</code> list. Then <code>\[shade.selectOne\]</code> would <i>normally</i> return a random sub-list (e.g. the <code>red</code> sub-list). But now we're using "dynamic odds" to restrict which sub-list gets
    chosen, and if <code>c</code> is equal to "blue", then the blue sub-list will get chosen (because <code>^\[c == "blue"\]</code> is true and <code>^\[c == "red"\]</code> is false), and so we'll get an output like "teal" or "navy blue".
  </p>

  <p>
    Note also that we need quotes around "blue" in <code>^\[c == "blue"\]</code>. The previous example didn't have quotes because we were dealing with numbers rather than text. Text always needs quotes around it when you're writing it inside square brackets. If we wrote <code>^\[c == blue\]</code>,
    then the Perchance engine would look for a variable or list called <code>blue</code> and check if it is equal to <code>c</code>. The quotes tell Perchance that we're talking about the literal text "blue" rather than a variable or list with that name.
  </p>

  <p>
    Again, this is only a small taste to get you curious. If you'd like to learn more, check out the "Dynamic Odds" section on the <a href="https://perchance.org/examples" target="_blank">examples</a> page - and while you're there, check out the "Dynamic Sub-list Selection" for an easier way to
    write the above example. You might also like to check out the section called "if/else Statements", which are related to dynamic odds.
  </p>

  <h2>Cool!</h2>

  <p>
    That's the end of the basic tutorial, but there's a lot more to learn! If you'd like to learn more, check out the <b><a href="/examples">examples</a></b
    >, <a href="/templates">templates</a> and the <a href="/advanced-tutorial">advanced tutorial</a>. You'll learn more about multi-level lists, special properties like "$output", changing fonts, using external APIs, procedurally generated images, dynamic random worlds, procedural story generators
    and tips for building extremely complex generators. You might also like to see what others are currently building on Perchance over at the <a href="/generators">generators</a> page. If you've got any questions or suggestions about how this tutorial could be improved, please post a message on the
    <a href="http://lemmy.world/c/perchance">Perchance Lemmy community</a> 👍
  </p>

  <h2>P.S.</h2>
  <p>Here are a couple of things that are worth knowing, but aren't essential to get started using Perchance:</p>
  <ul>
    <li>If you share your generator's link with someone, they will be able to click the "edit" button and see your code, but if they save the edits, it won't affect your generator - it'll create a copy of your generator with a new URL.</li>
    <li>By default your generator is publicly-listed on the <a href="https://perchance.org/generators" target="_blank">perchance.org/generators</a>. You can remove your generator from all public lists by clicking the settings button in the top-right of the page, and clicking "make private".</li>
    <li>
      Perchance is a very "sharing-is-caring" community. We encourage you to share your creations with others, knowing they they can click the edit button to check out your code, and maybe create a remixed version. If you do use someone else's code, it's nice to credit them by linking back to the
      original generator :)
    </li>
    <li>You can change the URL of your generator by clicking the settings button in the top-right of the page.</li>
    <li>There's also a "download" button in the settings menu so you can download your generator and use it offline. Use the <a href="https://perchance.org/download-button-plugin" target="_blank">download-button-plugin</a> to add a button to your generator so others can download it too.</li>
    <li>There are lots of <a href="/plugins">plugins</a> that you can use to extend the functionality of Perchance.</li>
    <li>There's also a <a href="/templates">templates</a> page that you can use to find a design that you like.</li>
    <li>
      If you want an easier alternative to writing HTML, you might like to check out the <a href="/markdown-plugin" target="_blank">markdown plugin</a>. Markdown isn't anywhere near as customizable as HTML, but it's much easier to get started with. You might also like to check out the
      <a href="/layout-maker-plugin" target="_blank">layout-maker-plugin</a>, which makes it easy to create complex layouts that would be hard to produce with basic HTML knowledge.
    </li>
    <li>The <a href="/examples">examples</a> page teaches you how to create generators that take in user input - e.g. drop-down menus, and stuff like that.</li>
    <li>There are a bunch of keyboard shortcuts for Perchance listed <a href="https://perchance.org/perchance-keyboard-shortcuts">here</a></li>
    <li>If you mess up and accidentally delete one of your lists (and you've tried Ctrl+Z to undo but it doesn't go back far enough), then you can click the "revisions" button to download previous versions of your generator.</li>
    <li>
      Everything inside square brackets is actually just JavaScript (with some added Perchance magic like selectOne/pluralForm/etc), so if you know some JavaScript you can do all sorts of fancy stuff. Plugins are also coded in JavaScript. If you don't know JavaScript, but would like to learn,
      <a href="https://www.khanacademy.org/computing/computer-programming">Khan Academy</a> has a great JavaScript course. It also teaches you HTML and CSS so you can design a nice-looking generator.
    </li>
    <li>If you have a blog or a website, you can embed your generator in your posts/pages like this (note that the domain is <code>null.perchance.org</code> rather than <code>perchance.org</code>):</li>
  </ul>
  <pre>
&lt;iframe src="https://null.perchance.org/my-generator-name"&gt;&lt;/iframe&gt;
</pre
  >
</main>
<p style="text-align:center; font-size:200%; opacity:0.2; margin-top:0.5em;"><span>⚄&#xFE0E;</span></p>
<br />

<style>
  ul li {
    margin-top: 0.5em;
  }
  main {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    background: light-dark(#fff, #101010);
    padding: 1em;
    border-radius: 3px;
    box-shadow:
      0 0.5px 0 0 #ffffff inset,
      0 1px 2px 0 #b3b3b3;
    box-shadow:
      0 0.5px 0 0 light-dark(#fff, #060606) inset,
      0 1px 2px 0 light-dark(#b3b3b3, #2c2c2c);
  }
  p {
    text-align: left;
    line-height: 1.4em;
  }
  main p:first-child {
    margin-top: 0;
  }
  body {
    background-color: #f6f6f6;
    background-color: light-dark(#f6f6f6, #000);
    color: black;
    color: light-dark(black, #d6d6d6);
  }
  pre {
    text-align: left;
    background: #333;
    background: light-dark(#333, #212121);
    color: #e2e2e2;
    padding: 1em;
    border-radius: 2px;
    tab-size: 2;
    -moz-tab-size: 2;
    -o-tab-size: 2;
    -webkit-tab-size: 2;
  }
  code {
    background: #eff0f1;
    background: light-dark(#eff0f1, #272727);
    padding: 1px 5px;
    white-space: nowrap;
  }
  details {
    background: #efefef;
    background: light-dark(#efefef, #212121);
  }
  details code {
    background: #d9d9d9;
    background: light-dark(#d9d9d9, #5a5a5a);
  }
  details p:last-child {
    margin-bottom: 0;
  }
  h2 {
    margin-top: 1.5em;
  }
  /*body::before {
		content: ' ';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    opacity: 0.1;
		background:url('data:image/jpeg;base64,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')
		background:#eee;	
}*/
</style>

<style>
  #contentsCtn {
    position: fixed;
    top: 50%;
    transform: translate(0.5rem, -50%);
    background: white;
    background: light-dark(white, #222);
    text-align: left;
    padding: 1rem;
    border-radius: 3px;
    box-shadow:
      0 0.5px 0 0 #ffffff inset,
      0 1px 2px 0 #b3b3b3;
    box-shadow:
      0 0.5px 0 0 light-dark(#ffffff, #000000) inset,
      0 1px 2px 0 light-dark(#b3b3b3, #000000);
  }
  .contents-item {
    cursor: pointer;
    padding: 0.25rem;
    font-size: 0.85rem;
  }
  .contents-item:hover {
    background: #efefef;
    background: light-dark(#efefef, #444);
  }
  @media screen and (max-width: 1200px) {
    #contentsCtn {
      display: none;
    }
  }
  html {
    color-scheme: light dark;
  }
</style>
<div id="contentsCtn">
  <div style="font-weight:bold; padding:0.25rem;">Contents</div>
</div>
<script>
  var maxtContentsItemTitleLength = 20;
  if (window.innerWidth > 1300) maxtContentsItemTitleLength = 40;

  let headerEls = [...document.querySelectorAll("h2")];
  let contentsItems = [];
  for (let el of headerEls) {
    let item = createContentsItem(el);
    contentsItems.push(item);
    contentsCtn.appendChild(item);
  }

  function createContentsItem(el) {
    let div = document.createElement("div");
    div.innerHTML = `
		  <div class="contents-item" data-title="${el.textContent.replace(/"/g, "&quot;")}">${el.textContent.length > maxtContentsItemTitleLength ? el.textContent.slice(0, maxtContentsItemTitleLength - 1) + "…" : el.textContent}</div>
		`;
    let item = div.firstElementChild;
    item.onclick = function () {
      el.scrollIntoView();
      window.scrollBy(0, -20);
      window.location.hash = el.id ? "#" + el.id : "";
    };
    return item;
  }
  let contentsTitleHighlighterDebounceTimeout = null;
  window.addEventListener("scroll", function () {
    clearTimeout(contentsTitleHighlighterDebounceTimeout);
    contentsTitleHighlighterDebounceTimeout = setTimeout(() => {
      let h2s = Array.from(document.querySelectorAll("h2"));
      let closestEl = null;
      let closestDist = null;
      for (let h2 of h2s) {
        let rect = h2.getBoundingClientRect();
        if (rect.top > window.innerHeight / 2) continue;
        if (closestEl === null || Math.abs(rect.top) < closestDist) {
          closestDist = Math.abs(rect.top);
          closestEl = h2;
        }
      }
      contentsCtn.querySelectorAll(`.contents-item`).forEach((el) => (el.style.background = ""));
      if (closestEl) {
        let closestTitle = closestEl.textContent;
        contentsCtn.querySelector(`.contents-item[data-title="${closestTitle.replace(/"/g, '\\"')}"]`).style.background = CSS.supports("color", "light-dark(#fff,#000)") ? "light-dark(#efefef,#444)" : "#efefef";
      }
    }, 200);
  });
</script>
```

---

```html
<h1>Advanced Perchance Tutorial</h1>
<main>
  <p style="margin:0;">Currently the <a href="/examples"><b>examples/walkthroughs</b></a> page takes the place of the advanced tutorial until I get around to writing it. Most of the dot-points below are actually covered on that examples page. You can ask about advanced techniques on our <a href="https://lemmy.world/c/perchance">Lemmy community</a>. Also, if you're interesting in learning more advanced Perchance techniques, you might be interested in <a href="https://www.khanacademy.org/computing/computer-programming/html-css">learning to code</a>! That's a link to Khan Academy which has some wonderful free learning resources that take you from the basics all the way up. Learning HTML, CSS and JavaScript (all 3 go hand-in-hand) will help you <i>immensely</i> in building complex and interesting Perchance generators (and you'll also be able to build your own websites, apps, games and whatever else you want).</p>
  <p>This is a growing "todo" list of things that I'll most likely be including in the advanced tutorial (or integrating into the first tutorial somewhere). Again, many of these topics have already found their way into the <a href="/examples">examples</a> page.</p>
  <ul>
    <li>The <code>update</code> function just executes square blocks in the HTML code - it doesn't "refresh" the page and e.g. clear all variables. (<a href="https://lemmy.world/post/2629825" target="_blank">1</a>)</li>
    <li>If/else notations: <code>\[ifThis ? thenThis : elseThis\]</code> (<a href="https://www.reddit.com/r/perchance/comments/82b23h/if_else_notation/dv982wt/">1</a>)</li>
    <li><i>Dynamic</i> odds notation (<code>... ^\[myVariable\]</code>) (<a href="https://www.reddit.com/r/rpg/comments/6ar3tc/a_tool_to_create_random_generators/dhgsn7v/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/aqbxbx/how_to_make_a_temperature_generator/egfadyq">2</a>)</li>
    <li>Loops (<a href="https://www.reddit.com/r/perchance/comments/8rrnwd/is_it_possible_to_set_items_to_have_values_and/">1</a>)</li>
    <li>Debugging "frozen" generators (never finish loading; infinite loop) (<a href="https://perchance.org/debug-freeze" target="_blank">1</a>)</li>
    <li>Creating "blueprints" of things like characters, and then randomly generating <i>specific instances</i> (<a href="https://perchance.org/create-instance-plugin">1</a>)</li>
    <li>Using <a href="plugins">plugins</a> to extend the functionality of perchance (<a href="dice-plugin">1</a>)</li>
    <li><i>Dynamic</i> property access and square bracket notation (<a href="https://www.reddit.com/r/perchance/comments/6d1mu8/coding_idea/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6dsk9e/question_archive/di524gc/">2</a>)</li>
    <li>Referencing the same variable across multiple randomly selected items (<a href="https://www.reddit.com/r/perchance/comments/6dxxfp/question_any_way_to_reference_the_same_variable/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6g1uqk/fixed_variables/">2</a>)</li>
    <li>Transferring variables between lists and imported generators (<a href="https://www.reddit.com/r/perchance/comments/bgphrz/how_do_i_pass_variablesreferences_to_imported/elsgw5z">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6gscyk/transferring_variables_between_generators/">2</a>)</li>
    <li>Use of <code>selectOne</code> with hierarchical lists (<a href="https://www.reddit.com/r/perchance/comments/6cu8v2/issues_with_selectone/">1</a>)</li>
    <li>Use of <code>selectOne</code> with inline lists like <code>num = \{1-3\}</code> vs. normal lists (<a href="https://www.reddit.com/r/perchance/comments/6qqc4d/items_in_shorthand_lists_arent_always_stored/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6lxicu/a_few_things_im_not_sure_are_possible_to_do/djzdo4c/">2</a>)</li>
    <li>Using <code>evaluateItem</code> to store a "fully evaluated" string of text (<a href="https://www.reddit.com/r/perchance/comments/6dsk9e/question_archive/dk7hap2/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6lxicu/a_few_things_im_not_sure_are_possible_to_do/djzdo4c/">2</a>)</li>
    <li>Selecting "leaf" nodes of your hierarchy (<a href="https://www.reddit.com/r/perchance/comments/6cu8v2/issues_with_selectone/dhz4vwk/">1</a>, <a href="https://perchance.org/select-leaf-plugin">2</a>, <a href="https://perchance.org/select-leaf-plugin-example#edit">3</a>)</li>
    <li>Strategies for hierarchical list organisation (<a href="https://www.reddit.com/r/rpg/comments/6ar3tc/a_tool_to_create_random_generators/dhgwwn1/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6dsk9e/question_archive/di526rv/">2</a>, <a href="https://www.reddit.com/r/perchance/comments/6g1uqk/fixed_variables/dio229r/">3</a>)</li>
    <li>True/false comparisons operators like <code>&gt;</code>, <code>&lt;</code>, <code>==</code>, etc. (<a href="https://perchance.org/battle-simulator-example#edit">1</a>, <a href="https://www.reddit.com/r/perchance/comments/aqbxbx/how_to_make_a_temperature_generator/egfadyq">2</a>)</li>
    <li><code>&amp;&amp;</code> ("and") and <code>||</code> ("or") operators (<a href="https://www.reddit.com/r/perchance/comments/6qjaqn/suggestion_defaults_for_undefined_values_in/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6lxicu/a_few_things_im_not_sure_are_possible_to_do/">2</a>)</li>
    <li>Arithmetic, incrementing/decrementing and numeric variables, in general (<a href="/battle-simulator-example">1</a>, <a href="https://www.reddit.com/r/perchance/comments/7p3qx8/curious_about_the_button/">2</a>)</li>
    <li>Some more <code>consumableList</code> examples and tips (<a href="https://www.reddit.com/r/perchance/comments/6bgpyg/can_you_select_like_from_a_deck_of_cards/dhmg56h/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/7j81h2/looking_for_help_with_consumable_lists/dr61uqs/">2</a>, <a href="https://www.reddit.com/r/perchance/comments/8qfhtr/id_like_consumablelist_to_fall_back_on_some/">3</a>, <a href="https://perchance.org/consumable-list-with-dynamic-odds-example#edit">4</a>)</li>
    <li>Use of <code>getLength</code> to find length of list (<a href="https://www.reddit.com/r/perchance/comments/8qfhtr/id_like_consumablelist_to_fall_back_on_some/">1</a>)</li>
    <li>Input boxes, dropdown lists, sliders, etc. (<a href="https://www.reddit.com/r/perchance/comments/6badc2/input_via_drop_down_list/">1</a>, <a href="https://www.reddit.com/r/perchance/comments/6at3d6/if_then_possible/">2</a>, <a href="https://perchance.org/sn636tot2k#edit">3</a>, <a href="https://www.reddit.com/r/perchance/comments/auzpnb/randomization_in_dropdown_menu_and_stored_text/">4</a>)</li>
    <li>Basic HTML formatting (bolding text, tables, etc.) (<a href="https://www.reddit.com/r/perchance/comments/6b25r9/beginner_question/">1</a>, <a href="https://perchance.org/make-table-plugin">2</a>)</li>
    <li>Navigating complex hierarchies like a pro (<code>this</code>, <code>getParent</code>) (<a href="https://www.reddit.com/r/perchance/comments/6dsk9e/question_archive/di52on0/">1</a>)</li>
    <li>Writing simple JavaScript functions and "plugins" (<a href="https://www.reddit.com/r/perchance/comments/6n9u9w/add_options_to_read_from_data_files_such_as_json/dkadts8/">1</a>)</li>
    <li>Overwriting built-in properties like <code>pluralForm</code> (e.g. for made-up words).</li>
    <li>Using and creating <a href="https://perchance.org/preprocessors">preprocessors</a>, <code>$preprocess</code> (<a href="https://perchance.org/inline-dent-preprocessor">1</a>)</li>
    <li>Using <code><a href="https://perchance.org/metadata-example#edit">$meta</a></code> to define a generator's title, description, and preview image</li>
    <li>The <code>getName</code> property and where it's useful.</li>
    <li>The <code>getChildNames</code>, <code>getPropertyNames</code>, <code>getFunctionNames</code>, and <code>getAllKeys</code> properties.</li>
    <li>Advanced properties like <code>getRawListText</code> and <code>createClone</code>.</li>
    <li>Getting the odds of an item with <code>getOdds</code>.</li>
    <li>The global <code>generatorName</code>, <code>generatorPublicId</code>, and <code>generatorLastEditTime</code> variables.</li>
    <li>Getting the "root" of your Perchance tree (the list that contains all your lists) with <code>root</code> (<a href="https://perchance.org/goto-and-remember-plugins-example#edit" target="_blank">1</a>).</li>
    <li>Create a new Perchance tree out of some text with <code>newRoot = createPerchanceTree(text)</code>. For example, <code>\[createPerchanceTree("name\\n\\tbob").name\]</code> will output "bob". Note that if you have imports within the text, then you'll need to to make sure the data for that import is preloaded by importing it into your generator somewhere. It doesn't matter <i>where</i> it's imported, you just need to have <code>\{import:foo\}</code> <i>somewhere</i> in your generator if you want to use <code>\{import:foo\}</code> within your <code>createPerchanceTree</code> text. Related: <a href="https://perchance.org/dynamic-import-plugin" target="_blank">perchance.org/dynamic-import-plugin</a></li>
  <!-- 	<li><code>list=\[otherList\]</code> creates a direct reference, but <code>list=\[otherList.selectOne\]</code> (and anything other than an exact list name like <code>list=\[otherList.titleCase\]</code> or <code>list=\[doThing()\]</code>) means that <code>list</code> is a getter and is <i>dynamically</i> executed each time it is called.</li> -->
    <li>Async functions and promises: <code>async doThing(a, b) => ...</code></li>
    <li>If your generator is getting large/complex, give "inputs" to lists as if they were "functions", like <code>\[myList.foo=123, myList\]</code> (where <code>myList</code> contains <code>\[this.foo\]</code> within it), rather than using "global" variables like <code>\[foo=123, myList\]</code>, where possible/practical. Otherwise you may accidentally have a "global" <code>foo</code> variable in multiple places that is meant to be used to track/hold different things.</li>
    <li>If you want to run some code but ignore any Perchance errors that occur during it, then use this: <code>window.ignorePerchanceErrors(() => \{ putYourCodeHere \})</code>. The return value of this function is the return value of the callback code that you provide. Useful when evaluating user-provided Perchance syntax which may have bugs. You can also run <code>window.clearPerchanceErrors()</code> to clear all existing error logs.</li>
    <li>During page load here's the order of things: (1) The HTML is added to the page without running the <code>&lt;script&gt;</code> tags. (2) All the <code>&lt;script&gt;</code> tags are executed in order from top to bottom. (3) All the square blocks in the HTML are executed from top to bottom (and left-to-right within each line). And that's it. The key point here is that square blocks are only executed after <i>all</i> the script tags have been executed. An extra technical note: Per web standards, <i>module</i> scripts (these: <code>&lt;script type="module"&gt;...&lt;/script&gt;</code>) automatically have the 'defer' attribute, which means they aren't necessarily executed one after the other (since they can have top-level await code within them, which can pause/delay the script execution for an arbitrary length of time).</li>
    <li>Unlike in square blocks and normal <code>&lt;script&gt;</code> tags, code inside a <code>&lt;script type="module"&gt;</code> tag cannot refer to Perchance lists simply using their name. So if you want to grab a random animal from your <code>animal</code> list from inside a module script, you must write <code>root.animal.selectOne</code> instead of just <code>animal.selectOne</code>.</li>
    <li>You can dynamically change the page/tab title with <code>document.title="foo"</code>, the URL hash with <code>window.location.hash="#foo"</code>, and the query string with <code>history.replaceState(\{\}, "", `/$\{generatorName\}?foo=123`)</code>, and they will work as expected (i.e. as if your code were running in the "top level frame" instead of an iframe. You can't use <code>history.replaceState</code> to change the pathname (i.e. the <code>generatorName</code> part of the URL), since that would allow for malicious 'spoofing' of other generators.</li>
    <li><i>As a viewer/user</i> of a generator (as opposed to an author/creator), you can prevent a generator from making external requests to servers that you have not explicitely allowed: <a href="https://perchance.org/custom-content-security-policy?$csp" target="_blank">perchance.org/custom-content-security-policy?$csp</a></li>
  </ul>

  <h2 id="public_apis">Public APIs</h2>
  <p>There are several public APIs which you can use. These have kind of grown 'organically', so they're not organized/named particularly well, but life goes on. Note that all changes/additions to these APIs are guaranteed to be backwards-compatible, and they'll <b>never</b> be deprecated, so you can safely use them in your generators.</p>
  <ul>
    <li><b>getGeneratorScreenshot</b></li>
    <ul>
      <li><code>perchance.org/api/getGeneratorScreenshot?generatorName=name</code></li>
    </ul>
    <li><b>getGeneratorList</b></li>
    <ul>
      <li><code>perchance.org/api/getGeneratorList</code> - get a list of recently edited generators</li>
      <li><code>perchance.org/api/getGeneratorList?max=123</code> - limit to a maximum of 123 generators</li>
      <li><code>perchance.org/api/getGeneratorList?tags=cool,nice</code> - get recently edited generators tagged with 'cool' and 'nice' in their <a href="https://perchance.org/tags-and-header-meta-data-example#edit" target="_blank">$meta.tags</a></li>
    </ul>
    <li><b>getGeneratorStats</b> - get views, last edit time, metadata, and public id of generator(s)</li>
    <ul>
      <li><code>perchance.org/api/getGeneratorStats?name=animal</code></li>
      <li><code>perchance.org/api/getGeneratorStats?names=animal,noun,adjective</code> - get multiple at once</li>
    </ul>
    <li><b>downloadGenerator</b></li>
    <ul>
      <li><code>perchance.org/api/downloadGenerator?generatorName=animal</code> - download the whole generator, bundled up as a single HTML file</li>
      <li><code>perchance.org/api/downloadGenerator?generatorName=animal&amp;listsOnly=true</code> - download just the lists code of a generator</li>
    </ul>
    <li><b>getGeneratorsAndDependencies</b></li>
    <ul>
      <li><code>perchance.org/api/getGeneratorsAndDependencies?generatorNames=animal,adjective</code> - gets the lists code for the generators, and all their imported generators, recursively</li>
    </ul>
  </ul>
  <p>If you're new to APIs like this, try opening your browser's developer tools (Ctrl+Shift+J for Chrome) and pasting this:</p>
<pre>
let result = await fetch(`https://perchance.org/api/getGeneratorsAndDependencies?generatorNames=animal,adjective`).then(r => r.json());
result.generators.animal
</pre>
  <p>Also check out <a href="https://perchance.org/getgeneratorsanddependencies-example" target="_blank">this example</a> which uses the <code>getGeneratorsAndDependencies</code> API to display the code for a generator, based on user input.</a>
  <hr>
	<p>Also check out the <a href="/known-bugs" target="_blank"><b>perchance.org/known-bugs</b></a> page for some gotchas to watch out for.</p>
</main>
<br><br><br>

<style>
  ul li {
		margin-top:0.5em;
	}
	main {
		max-width:900px;
		margin:0 auto;
		background: #fff;
		background: light-dark(#fff, #101010);
		padding:1em;
		border-radius:3px;
		box-shadow: 0 0.5px 0 0 #ffffff inset, 0 1px 2px 0 #B3B3B3;
		box-shadow: 0 0.5px 0 0 light-dark(#fff, #060606) inset, 0 1px 2px 0 light-dark(#B3B3B3, #2c2c2c);
	}
	p { text-align:left; line-height: 1.4em; }
  main p:first-child {
    margin-top:0;
  }
	body {
		background-color:#f6f6f6;
		background-color: light-dark(#f6f6f6, #000);
    color: black;
    color: light-dark(black, #d6d6d6);
	}
	pre {
		text-align:left;
		background: #333;
    background: light-dark(#333, #212121);
    color: #e2e2e2;
    padding: 1em;
    border-radius: 2px;
		tab-size: 2;
		-moz-tab-size: 2;
		-o-tab-size: 2;
		-webkit-tab-size: 2;
	}
	code {
		background: #eff0f1;
    background:  light-dark(#eff0f1, #272727);
    padding: 1px 5px;
		white-space: nowrap;
	}
	h2 {
		margin-top: 1.5em;
	}
	@media screen and (max-width: 600px) {
		#header {
			font-size:1.6rem !important;
		}
	}
  html { color-scheme: dark light }
</style>
```

---

```html
<h1>Perchance Example Generators</h1>
<main>

	<p style="margin-top:0;">This is a growing page of examples to help you learn about various perchance features and techniques to build certain types of generators. Remember to join the community over at <a href="https://lemmy.world/c/perchance">lemmy.world/c/perchance</a> and ask any questions if you're having trouble or would like something explained.</p>

	<h2 id="storing_selections" style="text-align:left;">Storing Selections</h2>
	<p>You'll often want to select a random item from a list and print it out, <i>but also remember the selected item</i> so that you can use it again later. <a href="/storing-selections-example-1#edit">Here's a simple generator</a> which shows us how to do this:</p>
<pre>
output
	I can never remember what \[w = word.selectOne\] means. Do you know what \[w\] means?

word
  benighted
	emeritus
	vole
	ex gratia
	bissextile
</pre>
	<p>If we've got a list called <code>word</code> that outputs a random word, then (as we already know) we can use it by writing <code>\[word\]</code>. To select a word and remember it for later, we write the following: <code>\[w = word.selectOne\]</code>. In plain English that says "Select one item from the <code>word</code> list and store it in a new variable called <code>w</code> (and also print out the selected word)". So now when we write <code>\[w\]</code> it'll output the word that was selected earlier.</p>
	<p>Notice that when we evaluate <code>\[w = word.selectOne\]</code>, it selects a random word, stores it in <code>w</code>, but <b>also</b> prints out the selected word in place of the square block. What if we don't want it to print out our selection? Well, in that case we'd write <code>\[w = word.selectOne, ""\]</code>. We can string together as many commands as we want within a single square-bracket block (separated by commas), but only the last command is printed out. So here we've added another command to the block, but that command is an "empty string". When we're within a square block we use quotation marks to indicate that we're writing literal text and not referring to the name of a list. In this case the literal text that we're referring to is nothingness! If we wrote instead wrote <code>\[w = word.selectOne, "apple"\]</code>, then that command would print out "apple" in place of the square-bracket block. Note that if we didn't put the quotation marks around "apple", then it'd look for a list called apple (and give us an error if it wasn't found).</p>
	<p>It's worth noting that <code>w</code> acts just like a normal variable/list. For example, you can write <code>\[w.upperCase\]</code> to write the selected word in upper case letters, or <code>\[w.pastTense\]</code> to get its past tense equivalent (if your word list contains only verbs). <a href="/storing-selections-example-2#edit">Here's an example</a> where we store a word and then reference a "child property" called <code>definition</code>.</p>

	<h2 id="execution_order" style="text-align:left;">Execution Order</h2>
	<p>Can you see something wrong with this example?</p>
<pre>
name = \{import:common-first-name\}

output
	\[n\] said "My name is \[n = name.selectOne\]" and then \{ran away|just stood there\}.
</pre>
  <p>The Perchance engine "reads" the code in a left-to-right order. So the problem is that Perchance reads <code>\[n\]</code> before we've created the <code>n</code> variable. As you can see in <a href="https://perchance.org/quug0pp21x#edit" target="_blank">this example generator</a>, Perchance gives us an error telling us that <code>\[n\]</code> returned "undefined", meaning that there was no value stored in the <code>n</code> variable when we tried to access it to generate the start of our sentence.</p>
  <p>Here's a fixed version of the <code>output</code> list:</p>
<pre>
output
	\[n = name.selectOne\] said "My name is \[n\]" and then \{ran away|just stood there\}.
</pre>
  <p>Let's look at a slightly more complicated version where we've made the same mistake as the original example:</p>
<pre>
name = \{import:common-first-name\}

output
  \[n\] said "\[say\]" and then \{ran away|just stood there\}.

say
  My name is \[n = name.selectOne\].
</pre>
  <p>It's really the same example, except that we've pulled the "My name is..." out into its own list - maybe because in the future we want to have multiple different <code>say</code> possibilities. But as I mentioned, we've made the same mistake as before: We've written <code>\[n\]</code> right at the start of the <code>output</code> line - before we've defined what <code>n</code> actually is.</p>
  <p>So here's a fixed version:</p>
<pre>
name = \{import:common-first-name\}

output
  \[n = name.selectOne\] said "\[say\]" and then \{ran away|just stood there\}.

say
  My name is \[n\].
</pre>
  <p>We put a name in the <code>n</code> variable before it gets used by the <code>\[say\]</code> block. The code now works <a href="https://perchance.org/quug0pp21x#edit" target="_blank">just like we want it to</a>.</p>
  <p>This is a good opportunity to learn about an important aspect of the Perchance engine: If you create a variable in one list, then you can access it from <u>any</u> other list, so long as that other list is "read" by the Perchance engine <u>after</u> you've created the variable.</p>
  <p>Let's look at an example:</p>
<pre>
name = \{import:common-first-name\}
noun = \{import:concrete-noun\}

output
  \[n = name.selectOne\] said "\[say\]" They then pulled several \[things\] out of their bag.

say
  My name is \[n\]. I like \[things = noun.selectOne.pluralForm\].
</pre>
  <p>Notice that we've created a variable in the <code>say</code> list, but then used it in the <code>output</code> list. That's perfectly fine, since we've written <code>\[thing\]</code> <u>after</u> creating the <code>thing</code> variable. Remember, the Perchance engine reads from left-to-right, so we know that it has already read the <code>\[say\]</code> part of the <code>output</code> line (which is where <code>thing</code> is created) before it gets to the <code>\[thing\]</code> part of the <code>output</code> line.</p>
  <p>If that sounds complicated, just read your code like you would normal text, and mentally substitute square blocks with random items from the relevant list. If you see a variable used before it has actually been created, then you know you've got a problem.</p>
  <p>One final note: The text in the HTML panel is also "read" by the Perchance engine from left-to-right, top-to-bottom - just like a book (an English book, at least). So let's say your HTML editor panel contained this code:</p>
<pre>
&lt;h1&gt;\[title\]&lt;/h1&gt;
&lt;p&gt;\[output1\]&lt;/p&gt;
&lt;p&gt;\[output2\]&lt;/p&gt;
&lt;button onclick="update()"&gt;\[buttonText\]&lt;/button&gt;
</pre>
  <p>In this case the Perchance engine would first pull a random item from the <code>title</code> list, and then "read" it, and then do the same for <code>output1</code>, then for <code>output2</code>, and then for <code>buttonText</code>. So if you define a variable in <code>output2</code>, you won't be able to use it in the items of your <code>output1</code> list. In other words, the same ordering rules apply for the HTML panel too.</p>

	<h2 id="importing_exporting" style="text-align:left;">Importing and Exporting</h2>
	<p>You've likely seen how we can import other generators into our generator:</p>
<pre>
sentence
	Don't worry, I'll just \{import:verb\} the \{import:noun\} ... \{import:ascii-face\}
</pre>
	<p>There are a bunch of generators listed <a href="/useful-generators">here</a> that you can try importing into your own generator.</p>
	<p>So that seems easy enough, but before we move on to exporting, what if you wanted to pluralise the result of <code>\{import:noun\}</code>? To do this, we need to "properly" import the <code>noun</code> generator like this:</p>
<pre>
noun = \{import:noun\}

sentence
	Don't worry, I'll just \{import:verb\} the \[noun.pluralForm\] ... \{import:ascii-face\}
</pre>
	<p>Once we've imported it and given it a name (<code>noun</code> in this case, but we could have called it anything), then we can treat it like a normal list and use <code>\[noun.pluralForm\]</code>, <code>\[noun.upperCase\]</code>, <code>\[noun.titleCase\]</code>, and so on. <a href="/import-example#edit">Here's a link</a> to an example generator based on the above code.</p>
	<p>Cool. Now let's talk about <b>exporting</b>. Let's say we've created a random generator for our favourite books:</p>
<pre>
book
	The Very Hungry Caterpillar
	Goodnight Moon
	Oh, The Places You'll Go!
	...
</pre>
	<p>You can click "settings" in the top-right corner of the screen (when editing your generator) to change your generator's url. Let's change its name to <code>fav-book</code> so we can access it from "perchance.org/fav-book": <a href="/fav-book">Here's a link</a> to our brand new generator.</p>
	<p>Now let's say we're in the process of making <i>another</i> generator and we realise that we need a list of our favourite books again. We could just go to our <code>fav-book</code> generator and copy the list into our new generator, and if the list is short that might be a good idea, but let's see how we can edit our <code>fav-book</code> generator so that it "exports" the book list:</p>
<pre>
$output = \[book\]

book
	The Very Hungry Caterpillar
	Goodnight Moon
	Green Eggs and Ham
	...
</pre>
	<p>You can see we've made a special variable called <code>$output</code> and set it equal to our book list. Now, whenever anyone uses <code>\{import:fav-book\}</code> they're get one of your favourite books! Pretty neat.</p>



	<h2 id="dynamic_odds" style="text-align:left;">Dynamic Odds</h2>
	<p>Sometimes you might sometimes want to change the odds of certain items in a list based on what item was previously randomly selected from another list. For example, let's say you're randomly selecting a character, and then randomly selecting a fruit that they're eating. But you've got some characters that don't eat certain fruits, so you want to make sure you don't randomly select fruits that they wouldn't enjoy, or are allergic to. So let's say that Jamie is allergic to blueberries, but all of the other characters can eat any fruit. Here's how we'd prevent blueberries from being chosen if the chosen character was Jamie:</p>

<pre>
output
  \[c = character.selectOne\] was eating \[fruit\]

character
  Adela
	Aisha
	Jamie
	Bob

fruit
  an apple
	some blueberries ^\[c != "Jamie"\]  <span style="opacity:0.5">// only selectable if c is NOT equal to "Jamie"</span>
	a slice of watermelon
</pre>

	<p>What we're doing here is using a square block <b>within an odds declaration</b>. So instead of "static" odds like <code>^4</code> or <code>^0.3</code>, we're using a square block in place of 4 or 0.3 to <i>generate</i> the odds each time we randomly select an item from that list. In this case, we've got a "logical" statement inside the square block: <code>c != "Jamie"</code>. This means: <code>c</code> <i>is not equal to</i> <code>"Jamie"</code>. Is that logical statement true, or false? Well, we don't know yet! It depends on what the <code>c</code> variable contains and that only gets decided when we actually run the generator. We do know that <code>c</code> will contain a character name, but we don't know which one yet.</p>
  <p>Okay, so if we run the generator and "Jamie" is selected by the <code>\[c = character.selectOne\]</code> block, then <code>c</code> <i>does</i> contain "Jamie" and so <code>c != "Jamie"</code> is <b>false</b>. So the odds declaration essentially changes from <code>^\[c != "Jamie"\]</code> to <code>^false</code> in that case. Now, it turns out that <code>^false</code> is exactly equivalent to <code>^0</code> - they mean the same thing. So what we've done is set the odds of the "some blueberries" item to <b>zero</b> whenever <code>c</code> contains "Jamie".</p>
  <p>Does that make sense? If not, that's okay! This is complicated stuff if you're new to coding. Try re-reading the above carefully, and if you're still confused, read below, because there's another way to do this which might make more sense to you (and remember, you can always ask for help <a href="https://lemmy.world/c/perchance" target="_blank">on the forum</a>).</p>

	<p>You might not have come across it in your Perchance adventures yet, but you can make a square block output two (or more) different things based on a "question" that you ask Perchance, otherwise known as an "if/else" or "conditional" statement (<code>if x then y, otherwise z</code>):</p>

<pre>
number = \{1-6\}
output
  You rolled a \[n = number.selectOne\]. \[if (n &lt; 4) \{"Too bad"\} else \{"Cool"\}\].
</pre>

	<p>What's going on here? Let me explain: This stuff is called "if/else" syntax, and it's quite common in the programming world. In general, if/else statements say: <b>if this_thing is true, output something, otherwise output other_thing</b>. So "else" really means "otherwise" In the above example, we're saying "If <code>n</code> is less than <code>4</code>, output <code>"Too bad"</code>, otherwise output <code>"Cool"</code>.</p>

	<p>So we can use if/else to write our previous character/fruit example in another way:</p>

<pre>
fruit
  an apple
	some blueberries ^\[if (c == "Jamie") \{0\} else \{1\}\]
	a slice of watermelon
</pre>

	<p>That's a bit longer to write, but it might make it a bit easier to understand what's going on. If <code>c</code> equals <code>"Jamie"</code>, then we output <code>0</code> as the odds of "some blueberries", otherwise we output <code>1</code>.</p>

	<p>Side note: Notice that we've been putting <code>Jamie</code> inside quotation marks in our dynamic odds and if/else notation? That's important because if we wrote <code>if (c == Jamie) ...</code> then Perchance would interpret that as "if <code>c</code> is equal to the <code>Jamie</code> list or variable" rather than comparing <code>c</code> to the literal text "Jamie".</p>

	<p>Let's go through another example of some dynamic odds. See if you can work out what's going on:</p>
<pre>
temp = \{0-45\}

output
	Today it was \[t = temp.selectOne\] degrees Celcius, \[comment\]

comment
	so we had to wear warm coats. ^\[t &lt; 15\]
	so we went to the pool. ^\[t &gt; 30\]
	so we just wore shorts and t-shirts. ^\[t &gt;= 15 &amp;&amp; t &lt;=30\]
</pre>
	<p>Again, notice that in the <code>comment</code> list the "odds" of each item isn't a number? It is instead a logical statement, (aka, a <a href="https://en.wikipedia.org/wiki/Boolean_expression">boolean expression</a>). The "expression" <code>t &lt; 15</code> means "<code>t</code> is greater than <code>15</code>". If this expression is true, then it evaluates to <code>1</code>, otherwise it evaluates to <code>0</code>. So, for example, if <code>t</code> were <code>23</code>, then <code>^\[t &lt; 15\]</code> would "evaluate" to <code>^1</code> (the default likelihood), otherwise it would evaluate to <code>^0</code> (which means it is impossible - zero probability). Here are some "operators" that you can use in dynamic odds expressions:</p>
	<ul style="text-align:left;">
		<li><code>&lt;</code> means <b>is less than</b></li>
		<li><code>&gt;</code> means <b>is greater than</b></li>
		<li><code>&lt;=</code> means <b>is less than or equal to</b></li>
		<li><code>&gt;=</code> means <b>is greater than or equal to</b></li>
		<li><code>==</code> means <b>is equal to</b></li>
		<li><code>!=</code> means <b>is not equal to</b></li>
	</ul>
	<p>Also notice that last item in the <code>comment</code> list uses <code>&amp;&amp;</code> which means "and". So <code>^\[t &gt;= 15 &amp;&amp; t &lt;=30\]</code> will evaluate to <code>^1</code> only if <code>t</code> is greater than or equal to <code>15</code> AND <code>t</code> is less than or equal to <code>30</code>, otherwise it will evaluate to <code>^0</code>. You can also use "or" in your expressions by writing <code>||</code>.</p>

  <p>Let's quickly jump back to our Jamie/blueberries example to show how we'd make it so Aisha is also allergic to blueberries:</p>

<pre>
fruit
  an apple
	some blueberries ^\[c != "Jamie" &amp;&amp; c != "Aisha"\]  <span style="opacity:0.5">// only if (c is NOT equal to "Jamie") AND (c is NOT equal to "Aisha")</span>
	a slice of watermelon
</pre>

	<p>What if, for example, you wanted to give an item an odds of <code>^8</code> if a certain boolean expression was true? Here's how you could do that:</p>
<pre>
comment
  ...
	what a perfect day! ^\[(t == 24)*8\]
</pre>
	<p>That works because <code>true</code> is "arithmetically" equivalent to <code>1</code> and <code>false</code> is "arithmetically" equivalent to <code>0</code>. <a href="https://www.reddit.com/r/perchance/comments/gqshq1/change_probability_based_on_variables_and_percent/fs4yvlo/" target="_blank">Here's a post</a> from the forum that explains this further in case you're interested.</p>
	<p>But we're getting into more complex territory where it may be easier to just use an if/else statement:</p>
<pre>
comment
  ...
	what a perfect day! ^\[if (t == 24) \{8\} else \{0\}\]
</pre>
	<p>That means "if the temperature is 24, the odds will be 8, otherwise they'll be 0". As I mentioned earlier, the syntax/format is:</p>
<pre>
if (<b>this_is_true</b>) \{<b>then_output_this</b>\} else \{<b>output_this</b>\}
</pre>
	<p>The word "<b>else</b>" just means "<b>otherwise</b>" in this context. As explained earlier, you can use if/else statements anywhere in your Perchance code - not just in dynamic odds. So, for example, this code works as you'd expect:</p>
<pre>
comment
	what a \[if (t == 24) \{"perfect"\} else \{"terrible"\}\] day!
</pre>
	<p>And again, as a reminder, notice that we need to put quotes around "perfect" and "terrible" - otherwise Perchance would think we were referring to lists or variables with the names <code>perfect</code> and <code>terrible</code>. Here's an example where we don't add quotes becasue we do actually want to refer to lists:</p>
<pre>
comment
	what a \[if (t == 24) \{goodAjective\} else \{badAjective\}\] day!

goodAdjective
  perfect
	happy
	...

badAdjective
  terrible
	sad
	...
</pre>
	<p>Since we're not using quotes around <code>goodAdjective</code> and <code>badAdjective</code>, Perchance knows that we're referring to lists that have those names, rather than the literal text "goodAdjective" and "badAjective". Note that you can also "chain" the if/else statements like so:</p>
<pre>
comment
  ...
	what a perfect day! ^\[if (t == 24) \{8\} else if (t &lt; 24) \{4\} else \{1\}\]
</pre>
	<p>Okay, back to dynamic odds. Let's throw an "or" operator in our previous example to make it so <code>23</code> degrees also causes the "what a perfect day!" comment with a high probability:</p>
<pre>
comment
  ...
	what a perfect day! ^\[if (t == 24 || t == 23) \{8\} else \{1\}\]
</pre>
	<p>Brackets become very important in boolean expressions when they start to become complex and include both "and" and "or" operators. Do you remember "<a href="https://en.wikipedia.org/wiki/Order_of_operations">order of operations</a>" from primary school? They might have taught you a term like "BIMDAS" to help you remember which operations come first. Boolean expressions also have an order of operations:</p>
	<ol style="text-align:left;">
		<li>Brackets</li>
		<li>Less-than / greater-than</li>
		<li>Equals-to / not-equal-to</li>
		<li>And</li>
		<li>Or</li>
	</ol>
	<p>So you'll need to use brackets to create complex expressions like this, for example:</p>
<pre>
... ^\[x > 10 &amp;&amp; (y &lt; 12 || z == 1)\]
</pre>
	<p>As hinted at in the <code>*8</code> example above, you can also use arithmetic expressions in dynamic odds, just like you can in normal square bracket blocks. Let's start with a simple example using subtraction inside square brackets:</p>
<pre>
temp = \{0-45\}

output
	Today it was \[t = temp.selectOne\] which is 7 degrees greater than yesterday, when it was \[t-7\] degrees.
</pre>
	<p>We can "randomize" the number <code>7</code> in the above example like this:</p>
<pre>
temp = \{0-45\}
diff = \{5-10\}

output
	Today it was \[t = temp.selectOne\] which is \[d = diff.selectOne\] degrees greater than yesterday, when it was \[t-d\] degrees.
</pre>
	<p>And here's a "contrived" example that uses some arithmetic inside dynamic odds notation (since, at the moment, I can't think of a <i>simple</i> "real-world" example where this would be useful):</p>
<pre>
num = \{1-6\}

output
	I rolled a \[n1 = num.selectOne\] and a \[n2 = num.selectOne\]. \[comment\]

comment
	 Multiply. ^\[n1 * n2\]
	 Add. ^\[n1 + n2\]
	 Divide. ^\[n1 / n2\]
	 More complex. ^\[n1 + n2 * n1\]
	 More complex, plus re-ordering. ^\[(n1 + n2) * n1\]
</pre>





	<h2 id="if_else" style="text-align:left;"><code>if</code>/<code>else</code> Statements</h2>
	<p>In Perchance it's possible to make a square block output two <i>different</i> things depending on whether the answer to a "question" is true or false. Below is a simple example where we:</p>
  <ol style="text-align:left;">
    <li>Select a random number and put it in the "variable" called <code>n</code> (so we can use that number later)</li>
    <li>Check if that number less than 4</li>
    <li>If it is, then we output a random item from the <code>sad</code> list</li>
    <li>Otherwise ("else") we output an item from the <code>happy</code> list</li>
  </ol>
<pre>
number = \{1-6\}

output
  You rolled a \[n = number.selectOne\]. \[if (n &lt; 4) \{sad\} else \{happy\}\].

sad
  Too bad
  Oh well

happy
  Cool
  Nice
</pre>
  <p><a href="https://perchance.org/simple-if-else-example#edit" target="_blank">Here's an example generator</a> with the above code for you to play around with. You should think of the word <code>else</code> as being equivalent to the word "otherwise". So if/else statements are written in the following form:</p>
<pre>
if (thisIsTrue) \{outputThis\} else \{outputThisOtherThing\}
</pre>
  <p>Which just means:</p>
<pre>
if <b>thisIsTrue</b> then <b>outputThis</b>, otherwise <b>outputThisOtherThing</b>
</pre>
  <details style="padding:1rem;">
  <summary style="cursor:pointer;">Side Note <span style="opacity:0.5;">(click me)</span></summary>
<p>There is a "short-hand" version of if/else statements that looks like this:</p>
<pre>\[ifThisIsTrue ? outputThis : outputThis\]</pre>
  <p>So here's what the above dice example would look like:</p>
<pre>
You rolled a \[n = number.selectOne\]. \[n &lt; 4 ? sad : happy\].
</pre>
  <p>I'll explain this short-hand version properly towards the end of this section. Keep reading until the end to learn more about this syntax.</p>
  <p>The curly brackets of the long-hand if statement can be confusing, because they're completely different to the normal curly brackets in Perchance. That's because everything that you write inside square brackets is actually JavaScript, and so the meanings of different special characters aren't the same as in regular Perchance code (when you're writing outside square brackets, that is). Luckily, in JavaScript, you can also write if/else statements like this:</p>
<pre>
if (thisIsTrue) outputThis ;else outputThisOtherThing
</pre>
  <p>So the above sad/happy sad/happy example would look like this:</p>
<pre>
You rolled a \[n = number.selectOne\]. \[if(n &lt; 4) sad ;else happy\].
</pre>
    <p>Feel free to use this approach if it looks nicer to you.</p>
</details>
  <p>Notice that we don't need to put square brackets around <code>sad</code> and <code>happy</code> in the if/else statement? That's because whenever you're writing stuff inside square brackets you can (and should) refer to lists/variables without square brackets around their name. So, to be clear:</p>
<pre>
<span style="color:#fd4949">\[if (n &lt; 4) \{\[sad\]\} else \{\[happy\]\}\]</span> <span style="opacity:0.5">    // incorrect!</span>
<span style="color:#fd4949">\[if (\[n\] &lt; 4) \{sad\} else \{happy\}\]</span> <span style="opacity:0.5">      // incorrect</span>
<span style="color:#00d800">\[if (n &lt; 4) \{sad\} else \{happy\}\]</span> <span style="opacity:0.5">        // correct</span> 😌
</pre>
  <p>If instead of having lists for sad and happy results, we just wanted to output some literal text depending on what <code>n</code> was, then we surround the stuff that's within the curly brackets in quotation marks, and that tells Perchance to output the literal text in the quotes rather than looking for lists with those names:</p>
<pre>
number = \{1-6\}

output
  You rolled a \[n = number.selectOne\]. \[if (n &lt; 4) \{"Too bad"\} else \{"Cool"\}\].
</pre>
  <p>But so far we've only learned how to test if n is <i>less than</i> 4. Here's how we'd test other types of conditions:</p>
  <ul style="text-align:left;">
		<li><code>if (n &gt; 4) ...</code> means: if <code>n</code> <b>is greater than</b> 4</li>
		<li><code>if (n &lt;= 4) ...</code> means: if <code>n</code> <b>is less than or equal to</b> 4</li>
		<li><code>if (n &gt;= 4) ...</code> means: if <code>n</code> <b>is greater than or equal to</b> 4</li>
		<li><code>if (n == 4) ...</code> means: if <code>n</code> <b>is equal to</b> 4</li>
		<li><code>if (n != 4) ...</code> means: if <code>n</code> <b>is not equal to</b> 4</li>
	</ul>
  <p>And here's an example where we test if <code>f</code> is equal to "banana":</p>
<pre>
fruit
  apple
  banana
  peach

output
  Did you know that a \[f = fruit.selectOne\] is \[if (f == "banana") \{"not spherical"\} else \{"spherical"\}\]?
</pre>
  <p><a href="https://perchance.org/simple-if-else-example-3#edit" target="_blank">Here's an example generator</a> using the above code. Notice that we write <code>if (f == "banana")</code> and not <code>if (f == banana)</code>. That's because the latter one would actually look for a list called <code>banana</code> instead of comparing <code>f</code> to the literal text "banana". It's easy to accidentally forget those quotes, so watch out for that.</p>
  <p>You can also compare two variables with one another like so:</p>
<pre>
fruit
  apple
  banana
  peach

output
  \[f1 = fruit.selectOne\] and \[f2 = fruit.selectOne\] are \[if (f1 == f2) \{"the same"\} else \{"different"\}\] fruits.
</pre>
  <p><a href="https://perchance.org/simple-if-else-example-2#edit" target="_blank">Here's an example generator</a> using the above code.</p>
  <p>If you'd like an "if" <i>without</i> an "else", then you can just use empty quotes for the "else":</p>
<pre>
if (a == 4) \{outputThis\} else \{""\}
</pre>
  <p>If you want to <i>do</i> something in an if/else statement, but not output anything, then use the normal <code>, ""</code> approach like this (here we add 3 to <code>a</code> if it's equal to 4):</p>
<pre>
if (a == 4) \{a=a+3, ""\} else \{""\}
</pre>
  <p>If you want your outputs to contain regular text <i>and also square/curly blocks</i>, then you should wrap all the output text in quotes:</p>
<pre>
if (b &gt; 0) \{"There are a few \[animal.pluralForm\] here."\} else \{"There are \{not any|no\} animals here."\}
</pre>
  <br>
  <p>So far, we've been writing if/else statements of the following form:</p>
<pre>
if (thisIsTrue) \{outputThis\} else \{outputThisOtherThing\}
</pre>
  <p>But we can actually add more "conditions" that output different things, like so:</p>
<pre>
if (thisIsTrue) \{outputThis\} else if (thisOtherThingIsTrue) \{outputThisOtherThing\} else \{outputThisAsABackup\}
</pre>
  <p>And we can "chain" as many of these <code>else if</code>s together as we want. Here's an example:</p>
<pre>
number = \{1-6\}

output
  You rolled a \[n = number.selectOne\]. \[if (n &lt; 3) \{"Ouch."\} else if (n &lt; 5) \{"Not too bad."\} else \{"Woo hoo!"\}\]
</pre>
  <p><a href="https://perchance.org/simple-if-else-example-4#edit" target="_blank">Here's an example generator</a> using the above code. As you can see, we're outputting "Ouch." if they rolled less than 3, otherwise if they rolled less than 5 we output "Not too bad.", and if neither of those conditions (<code>n &lt; 3</code> and <code>n &lt; 5</code>) were true, then we output "Woo hoo!" because that must mean they rolled either a 5 or a 6.</p>
  <p>As I said, we can have as many <code>else if</code>s as we like, so we could have one for every number:</p>
<pre>
You rolled a \[n = number.selectOne\]. \[if (n == 1) \{"Ouch."\} else if (n == 2) \{"Dang."\} else if(n == 3) \{"Not great."\} else if (n == 4) \{"Not bad."\} else if (n == 5) \{"Pretty good!"\} else \{"Woo hoo!"\}\]
</pre>
  <p>But for that sort of thing we'd be better off using dynamic odds (read the "Dynamic Odds" section on this page to learn about this):</p>
<pre>
number = \{1-6\}

output
  You rolled a \[n = number.selectOne\]. \[comment\]

comment
  Ouch. ^\[n == 1\]
  Dang. ^\[n == 2\]
  Not great. ^\[n == 3\]
  Not bad. ^\[n == 4\]
  Pretty good! ^\[n == 5\]
  Woo hoo! ^\[n == 6\]
</pre>
  <p>There's one more feature of if/else that might come in handy for you. Sometimes instead of simple conditions like "if <code>n</code> is greater than 2", you want something a bit more complicated like "if <code>n</code> is greater than 2 <b>and</b> <code>n</code> is less than 5". Here's how we'd write that:</p>
<pre>
if (n &gt; 2 &amp;&amp; n &lt; 5) ...
</pre>
  <p>So as you can see, <code>&amp;&amp;</code> means "<b>and</b>". Here's how you can use "<b>or</b>" in your conditions:</p>
<pre>
if (n == 1 || n == 6) ...
</pre>
  <p>That means "if <code>n</code> is equal to 1 <b>or</b> <code>n</code> is equal to 6".</p>
  <p><b>Side note:</b> It's very easy to accidentally write a single equals sign in your conditions like this: <code>if (n = 1) ...</code>. That actually sets <code>n</code> equal to 1 rather than checks whether it's equal to 1. So if you're getting weird behavior with your if/else statements, just double-check that you're using double-equals to check equality rather than a single equals sign.</p>
<pre>
if (n &gt; 2 &amp;&amp; f != "banana" ) ...
</pre>
  <p>That means "if <code>n</code> is greater than to 2 <b>and</b> <code>f</code> is not equal to <code>"banana"</code>".</p>
  <p>If you need <i>really</i> complex conditions, then you will need to use brackets to properly "group" them so they get executed in the correct order, like so:</p>
<pre>
if(x &gt; 10 &amp;&amp; (y &lt; 12 || z == 1)) ...
</pre>
  <p>There is actually another "short-hand" way to write if/else statements. The following two lines of code are equivalent:</p>
<pre>
\[if (n &lt; 3) \{"Not great."\} else \{"Cool!"\}\]

\[n &lt; 3 ? "Not great." : "Cool!"\]
</pre>
  <p>As you can see, the latter code is a bit shorter, but perhaps a bit harder to read. The general format of the short-hand if/else statement is:</p>
<pre>
\[ifThisIsTrue ? outputThis : otherwiseOutputThis\]
</pre>
  <p>And you can use it exactly like the previous approach. Here's an example with 2 conditions:</p>
<pre>
\[n == 5 || n == 6 ? "Great!" : ":("\]
</pre>
  <p>And here's an example with chained <code>else if</code>s:</p>
<pre>
\[n == 1 ? "Ouch" : n == 2 ? "Dang" : "Not terrible"\]
</pre>
  <p>And here's a longer chain:</p>
<pre>
\[n == 1 ? "Ouch" : n == 2 ? "Dang" : n == 3 ? "Not great" : n == 4 ? "Not too bad" : n == 5 ? "Great!" : "Woo hoo"\]
</pre>
  <p>So as you can see the pattern for chaining else/ifs with the short-hand method is:</p>
<pre>
\[condition1 ? result1 : condition2 ? result2 : condition3 ? result3 : backupResult\]
</pre>
  <p>And you can bunch the condition/results together to make it easier to read if you want:</p>
<pre>
\[condition1?result1 : condition2?result2 : condition3?result3 : backupResult\]
</pre>
  <br>
  <p>There are cases where if/else statements aren't the best solution to the problem, even though they seem like the most obvious one. Here's an example:</p>
<pre>
output
  \[r = race.selectOne, ""\] Their name is \[r == "human" ? name.human : r == "orc" ? name.orc : r == "elf" ? name.elf : "name/race error"\] and their race is \[r\].

name
  human = \{kate|bob\}
  orc = \{gruan|tsarok\}
  elf = \{gaia|filae\}

race
  human
  orc
  elf
</pre>
  <p>This example can be improved a lot by using "dynamic sub-list referencing", which is explained in another section on the page you're reading right now. Here's the simplified version that uses dynamic sub-list referencing:</p>
<pre>
output
  \[r = race.selectOne, ""\] Their name is \[name\[r\]\] and their race is \[r\].

name
  human = \{kate|bob\}
  orc = \{gruan|tsarok\}
  elf = \{gaia|filae\}

race
  human
  orc
  elf
</pre>
  <p>You should read the dynamic sub-list referencing section to understand the above code properly, but the basic gist is that <code>\[name\[r\]\]</code> gets the sub-list (or "sub-property") that has the same name as the value that's stored in the <code>r</code> variable. So if <code>r</code> contains "elf", then <code>\[name\[r\]\]</code> is the same as writing <code>\[name.elf\]</code>.</p>
  <p>If/else statements are very useful, but if you're starting to write really complex chains of <code>else if</code>s, then you should question whether you're doing it in the most efficient way. Often times there's a neater solution using hierarchical lists and dynamic sub-list referencing.</p>
  <p>Another way to make complex if/else statements neater is to use <b>functions</b>, which are explained in a later section on this page. I'll give you the basic gist of it now, but read the functions section to learn more. Let's say we've got <a href="https://perchance.org/simple-critical-hit-example#edit" target="_blank">a generator</a> where we roll a dice and then we want to double it if it's greater than or equal to 5:</p>
<pre>
dice = \{1-6\}

output
  \[d = dice.selectOne, ""\]\[if(d >= 5) \{d = d*2, ""\} else \{""\}\]Your calculated damage is \[d\].
</pre>
  <p>We could encapsulate all the damage calculations into a simple function <a href="https://perchance.org/simple-critical-hit-example-with-function#edit" target="_blank">like this</a>:</p>
<pre>
output
  Your calculated damage is \[calculateDamage()\].

dice = \{1-6\}

calculateDamage() =>
  d = dice.selectOne
  if(d >= 5) \{
    d = d * 2
  \}
  return d
</pre>
  <p>The nice thing about functions is that we don't need to scatter lots of <code>, ""</code> throughout our code, because the only thing that gets output by a function is the thing that we put after the <code>return</code> statement (which in this case is <code>d</code>).</p>
  <p>The other nice thing is that complex if/else statements (especially <i>nested</i> ones) are much more readable when you can put them on multiple lines:</p>
<pre>
calculateDamage() =>
  d = dice.selectOne
  if(d >= 5) \{
    d = d*2
  \} else if(d == 4) \{
    d = d + 2
  \} else \{
    d = d + 1
    if(d == 2) \{
      d = 1
    \}
  \}
  return d
</pre>
  <p>That still looks complicated, but it's much better than having it in a single line! You can treat the output of a function just like you would the output of any other command/plugin/etc in Perchance, so, for example, we can store the output of <code>calculateDamage()</code> and use it later:</p>
<pre>
output
  \[d1 = calculateDamage(), d2 = calculateDamage(), ""\]Your calculated damage is \[d1\] with a bonus of \[d2\] damage if it's a full moon.
</pre>


	<h2 id="multiline_output_formatting" style="text-align:left;">Multi-Line Output &amp; Formatting</h2>
	<p>What if we want to output text that isn't just on one long line, but is instead broken into multiple lines? We can do this by inserting <code>&lt;br&gt;</code> wherever we want to start a new line (a line <b>br</b>eak). For an example, let's say we're making a random character creator:</p>
<pre>
output = Character &lt;br&gt; Name: \[name\] &lt;br&gt; Eye color: \[eyeColor\] &lt;br&gt; Height: \[height\]

name = \{import:chocobo-name\}
eyeColor = \{green|brown|red|black|blue|purple\}
height = \{100-300\}cm
...
</pre>
	<p>Checkout the result of that <a href="/multiline-example#edit">here</a>. So we've got multiple lines happening, but it could do with a bit of formatting. Let's bold the "Character" title:</p>
<pre>
output = &lt;b&gt;Character&lt;/b&gt; &lt;br&gt; Name: \[name\] &lt;br&gt; Eye color: \[eyeColor\] &lt;br&gt; Height: \[height\]
</pre>
	<p>See what we've done there? We've wrapped "Character" in the <code>b</code> tag: <code>&lt;b&gt;Character&lt;/b&gt; = <b>Character</b></code>. If we wrap text with the <code>i</code> tag, we can make text italic: <code>&lt;i&gt;Character&lt;/i&gt; = <i>Character</i></code>. You can underline text by wrapping it in these tags: <code>&lt;u&gt;Character&lt;/u&gt; = <u>Character</u></code>. These "tags" are just a couple of the many HTML tags that you can use to format the output of your generator. In <a href="format-text-example#edit">this example</a> I've made "Character" bold and made the <code>name</code>, <code>eyeColor</code> and <code>height</code> values italic.</p>
	<p>Side note: If you want to take your Perchance skills to the next level, you should learn about <code>$output</code> (it's not just for exporting!), the <code>this</code> keyword, and special properties like <code>joinItems</code>. These are outside the scope of this simple guide, but if you learn them, you can create multi-line stuff <a href="/multiline-pro-example#edit">like a pro</a> (here's a <a href="/multiline-pro-simple-example#edit">simplified version</a> of that).</p>
	<p>If you'd like to have your generator output in a neat table format, then check out <a href="/html-table-example#edit">this HTML table example</a>. If you stare at the code in the HTML panel for a bit, you should be able to see how you can add extra rows and columns to the table. The general idea is that each row must start with <code>&lt;tr&gt;</code> and end with <code>&lt;tr/&gt;</code>. Within each row you can add column values that must be wrapped in <code>&lt;td&gt;</code> and <code>&lt;td/&gt;</code> like so: <code>&lt;td&gt;hello&lt;td/&gt;</code>.</p>


	<h2 id="user_input" style="text-align:left;">User Input</h2>
	<p>Sometimes you'll want to accept input from people who use your generator - perhaps their character's name, their age, or something like that. Let's go through some examples of different input types that we might want in our generator.</p>

	<p>First up, is a simple text input form, like this: <input placeholder="Please enter your name..."/>. Let's say we wanted to make it so whenever they type into that input, it puts the text that they've typed into a variable called <code>\[name\]</code>. We can then use this <code>\[name\]</code> variable wherever we want in our code. To do this, you simply need to paste the following code in the bottom-right panel of the editor (the HTML panel):</p>

<pre>
&lt;input oninput="name = this.value" placeholder="Please enter your name..."/&gt;
</pre>
	<p>Now whenever they type some text into that input form, the text will immediately be put into the <code>\[name\]</code> variable. All the magic is happening in this part of the above snippet: <code>oninput="name = this.value"</code>. That just means "Whenever the value in the input form changes, set the <code>\[name\]</code> variable to the text that's in the input form". If you don't fully understand how it works, that's fine - you can copy and paste this without really needing to know what's happening there.</p>

	<p>You can change <code>name</code> to <code>age</code> or to anything else you desire so long as it doesn't have any spaces. I recommend using capital letters like this <code>myVariable</code> or <code>MyVariable</code> to help you separate words and make them more readable, or you can use underscores like this: <code>my_variable</code>. <a href="/input-example#edit">Here's a minimal example</a> that uses the above code. If you'd like it to update as the user types (so they don't have to click a "generate" button), have a look at <a href="/input-autoupdate-example#edit">this auto-updating input example</a>.</p>

	<p>Notice in those examples that I've written <code>name = Default Name</code> in the Perchance code panel (the main editor on the left-hand side). We need to add a default name otherwise we'll get an error because we'd be using a variable before it actually exists (it would only come into existence once they start typing for the first time).</p>

  <p><b>Important note:</b> If you're taking a number as user input (such as an age, or height, etc.), you should write this instead:</p>
<pre>
&lt;input oninput="num = Number(this.value)" placeholder="Please type a number..."/&gt;
</pre>
  <p>If you don't do that, it may still work, but certain advanced features (like using the variable in "dynamic odds" statements) will behave weirdly because the engine treats the input as text rather than as a number. The <code>Number(...)</code> function converts text to a number.</p>

	<p>If you need a larger text box input, have a look at <a href="https://perchance.org/textarea-example#edit">this minimal textarea example</a>, and <a href="/newspaper-column-creator#edit">this</a> more complex example. If you'd like users of your generator to be able to input <b>their own lists</b>, have a look at <a href="https://perchance.org/user-input-list-example#edit">this example</a>.</p>

	<p>Next up is a drop-down list, like this: <select oninput="country = this.value"><option value="Mexico">Mexico</option><option value="Germany">Germany</option><option value="Britain">Britain</option></select>. To create a drop-down list like this, you'll need to paste the following code in your HTML panel:</p>
<pre>
&lt;select oninput="country = this.value"&gt;
	&lt;option value="Mexico">Mexico&lt;/option&gt;
	&lt;option value="Germany">Germany&lt;/option&gt;
	&lt;option value="Britain">Britain&lt;/option&gt;
&lt;/select&gt;
</pre>
	<p>Now whenever they select a different item in that drop-down menu, the <code>\[country\]</code> variable will be set to whatever is in the <code>value</code> attribute of the <code>&lt;option&gt;...&lt;/option&gt;</code> that they selected. So if they click an option like this: <code>&lt;option value="veg">Vegetables&lt;/option&gt;</code>, then the variable would be set to <code>"veg"</code>. The "Vegetables" part is just what gets actually displayed in the drop-down menu.</p>

  <p>If we were making a name generator where we let the user choose the nationality of the name to be generated (Mexican, German, or British), then our Perchance code might look something like this:</p>

<pre>
output
	\[BritishName\] ^\[country == "Britain"\]
	\[MexicanName\] ^\[country == "Mexico"\]
	\[GermanName\] ^\[country == "Germany"\]
</pre>

	<p>If you're confused about what's going on there, read the "Dynamic Odds" section that's on this page (scroll up). Here's <a href="/drop-down-list-example#edit">a drop-down list example</a> using the above code. Just as in the previous text-input example, if we change <code>country = this.value</code> to <code>country = this.value, update()</code>, then it will re-randomize the output automatically when they change their drop-down selection (so they don't need to click randomize after changing the drop-down). Here's an example of <a href="https://perchance.org/multiple-drop-down-lists-example#edit" target="_blank">multiple drop-down lists</a>. And <a href="https://perchance.org/dynamic-drop-down-list-example#edit" target="_blank">here's an example</a> of a drop-down list where its items are dyamically generated from one of your Perchance lists (<a href="https://www.reddit.com/r/perchance/comments/f4fja3/dynamic_dropdown_menu/" target="_blank">explained here</a>).</p>

	<p>Another common input type is a checkbox: <input type="checkbox">. Users can toggle this on and off by clicking it, and you can use its state (checked or unchecked) to change the odds of certain items in your lists (or, more commonly, to completely disable an item if a checkbox isn't checked). To add a checkbox to your generator, just add the following code to your HTML panel:</p>

<pre>
&lt;input type="checkbox" id="thingy"/&gt;
</pre>

	<p>In this example we've set the <code>id</code> of the checkbox to <code>thingy</code>, but you can call it whatever you want. You use the <code>id</code> to determine whether it's checked or not, like this: <code>\[thing.checked\]</code>. That will evaluate to <code>true</code> if it is checked, or <code>false</code> if it's not. So let's say you have these in your HTML panel:</p>

<pre>
&lt;input type="checkbox" id="animalBox"/&gt;
&lt;input type="checkbox" id="plantBox"/&gt;
</pre>

	<p>and this in your Perchance code panel:</p>

<pre>
animal = \{import:animal\}
plant = \{import:plant-species\}

output
  \[animal\] ^\[animalBox.checked\]
  \[plant\]  ^\[plantBox.checked\]
</pre>

	<p>And now the <code>\[output\]</code> list will only output an animal if the <code>animalBox</code> checkbox is checked, and it will only output a plant if the <code>plantBox</code> checkbox is checked. <a href="https://perchance.org/simple-checkbox-example#edit" target="_blank">Here's an example generator</a> based on the above code. Note that the checkbox <code>id</code>s must not have the same name as any of your lists or variables, so the above example wouldn't work if we used <code>id="animal"</code>. If you want your checkbox to be checked by default, just add the <code>checked</code> attribute to your checkbox HTML like so:</p>

<pre>
&lt;input type="checkbox" id="animalBox" checked/&gt;
</pre>

	<p>If you want the generator to re-randomize automatically when they click the checkbox, then add then you can add the <code>oninput</code> attribute like this:</p>

<pre>
&lt;input type="checkbox" id="animalBox" oninput="update()"/&gt;
</pre>

	<p><a href="https://perchance.org/checkbox-checklist-example#edit">Here's another simple check-box example</a>.</p>

	<p>There are lots of other types of inputs in HTML, for example you can make a <a href="https://perchance.org/color-picker-example#edit" target="_blank">color picker</a>, a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date" target="_blank">date picker</a>, a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range" target="_blank">sliding range</a>, and more. Learning some basic <a href="https://www.khanacademy.org/computing/computer-programming/html-css" target="_blank">HTML</a> and <a href="https://www.khanacademy.org/computing/computer-programming/programming">JavaScript</a> will help you if you want to make generators that rely heavily on inputs. It's hard work (especially JavaScript), but it's worth it!</p>



	<h2 id="hierarchical_lists" style="text-align:left;">Hierarchical Lists</h2>
	<p>Say you wanted to generate a random character of a certain fantasy race (elf, orc, human, etc.). Each of these different races have different probabilities of having different characteristics. For example, perhaps elves have a greater chance of having green eyes than the other races. And perhaps orcs can have red eyes, whereas the other races can't. So how do we create a random character while being able to control the probabilities of their characteristics based on their race?</p>
	<p>There are multiple ways of doing this, but one way is to use "hierarchical lists": lists of lists of lists, as many levels deep as we desire. Have a look at <a href="/hierarchy-example#edit">this generator</a> and try to get a rough sense of what's happening.</p>
	<p>Assuming you've done that, let's break it down by first looking at the <code>race</code> list (the only list other than <code>output</code> in this generator):</p>
<pre>
race
	elf
		name = elvish
		eyeColor
			green
			emerald
	human
		name = human
		eyeColor
			blue
			brown
	...
</pre>
	<p>You can see it has 3 items: <code>elf</code>, <code>human</code> and <code>orc</code>. Only the first two are shown here for brevity. Each of these items are themselves a list containing <code>name</code> and <code>eyeColor</code>. And finally, <code>eyeColor</code> is a list containing the possible eye colors for that race.</p>
	<p>So what would happen if we evaluated <code>\[race\]</code>? It'd just print out "elf", "human" or "orc", each with 33% probability. You can test that out by typing "\[race\]" into the bottom-left panel in the editor.</p>
	<p>But how would we create a sentence like "She was an orcish warrior with red eyes."? We'd need to write something like <code>She was a \[race\] warrior with ??? eyes.</code>, but as indicated by the question marks, how do we know which race was selected? We need to somehow <i>store</i> our previously selected race and then use it to randomly select a valid eye colour for that race.</p>
	<p><a href="/storing-selections-example-1#edit">Here's a generator</a> that shows how we store something so that we can use it again later, and <a href="/storing-selections-example-2#edit">here's another</a> that shows us how to grab properties of the remembered item. In the first example you can see this line:</p>
<pre>
I can never remember what \[w = word.selectOne\] means. Do you know what \[w\] means?
</pre>
	<p>Put simply, we're selecting one item from the <code>word</code> list and putting it in a new variable called <code>w</code>. Fun fact: When you write <code>\[word\]</code>, the perchance engine assumes that you wanted to select one item from the <code>word</code> list and print it out. However, when assigning a specific item to our new <code>w</code> variable, we need to explicitly tell perchance that we want <code>w</code> to be a single item from the <code>word</code> list. If we just wrote <code>\[w = word\]</code>, then we'd be assigning the <i>whole</i> <code>word</code> list to <code>w</code>, and so <code>w</code> would just become an alias (another name) for <code>word</code>.</p>
	<p>This "aliasing" or "nicknaming" can come in handy to shorten long list names:
<pre>
\[b = universe.middleEarth.shire.bilbo\] ... \[b.hitPoints\] ... \[b.mood\]
</pre>
	<p>The final thing left unexplained is the fact that we can put multiple commands within a square-bracket block. We separate them with a comma like so: <code>\[b.hitPoints += 10, b.name\]</code>. Here we've added 10 hitpoints to bilbo, and then called the <code>name</code> subproperty of bilbo. Perchance only displays the last item in a list of commands. This is handy when you've got commands that you want to execute, but you don't want them to print out anything.</p>
	<p>In that last example we increased bilbo's hit points by 10 and then printed out his name. What if you don't want to print anything out at all? In that case you can do this: <code>\[b.hitPoints += 10, ""\]</code>. Notice that the second command is just a pair of quotation marks with nothing between them. That's equivalent to saying "print nothing". If there was something between the quotation marks, it would print that.</p>
	<p><a href="https://perchance.org/hierarchy-example-2#edit">Here's another example generator</a> that uses a hierarchy in a similar manner to the original example in this section.</p>

	<h2 id="functions" style="text-align:left;">Functions</h2>
  <p>Let's say you've got <a href="https://perchance.org/critical-hit-if-condition-is-met#edit" target="_blank">a generator</a> where you're rolling some dice and then adding them together, and then selecting a name from a list, and dice sum the if we pick a certain name:</p>
<pre>
dice = \{1-6\}
name = \{Gim|Jin|Sae\}

output
  \[d = dice.selectOne, n = name.selectOne, ""\]\[if(name == "Sae") \{d = d*2, ""\} else \{""\}\]\[name\] attacked and dealt \[d\] damage.
</pre>
  <p>Now, that's a fairly simple example (so long as you've read the "if/else Statements" section on this page), but you can see how that one output line could get quite long and messy if you've got slightly more complex requirements. It becomes hard to read and hard to fix when you have bugs. So one way to fix this is to use the special <code>$output</code> property that overrides the default output of a list, such that we can spread our code across several lines:</p>
<pre>
output
  $output = \[this.joinItems("")\]
  \[d = dice.selectOne, n = name.selectOne, ""\]
  \[if(name == "Sae") \{d = d*2, ""\} else \{""\}\]
  \[name\] attacked and dealt \[d\] damage.
</pre>
  <p><a href="https://perchance.org/critical-hit-if-condition-is-met-multi-line#edit" target="_blank">That's a bit better</a>, but it's still a little hard to read, and would be even harder with a "real world" example that is a bit more complex. So in these cases it might be worth encapsulating your code <a href="https://perchance.org/critical-hit-if-condition-is-met-with-function#edit" target="_blank">into a function</a>:</p>
<pre>
output
  \[n = name.selectOne\] attacked and dealt \[calculateDamage()\] damage.

calculateDamage() =>
  d = dice.selectOne
  if(n == "Sae") \{
    d = d*2
  \}
  return d
</pre>
  <p>With functions we can neatly put each statement on a separate line, but we also don't need to scatter those pesky <code>, ""</code> things all around our code, because the only thing that gets output by a function is the thing after the <code>return</code> statement (in this case, <code>d</code>). In other words, all statements are hidden by default, and a function will output whatever comes after <code>return</code>.</p>
  <p><b>Side note:</b> The example that I've used so far isn't great, since it would make more sense to implement this sort of thing like this:</p>
<pre>
dice = \{import:dice-plugin\}
character
  Gim
    dmg = \[dice("1d6")\]
  Jin
    dmg = \[dice("1d6")\]
  Sae
    dmg = \[dice("2d6")\]

output
  \[c = character.selectOne, c.getName\] attacked and dealt \[c.dmg\] damage.
  <span style="opacity:0.5">// note: the .getName command gets the "name" of the item that it is applied to</span>
</pre>
  <p>But with functions we can do really complex things that would be hard to write and read with most other approaches:</p>
<pre>
calculateDamage() =>
  d = dice.selectOne
  if(n == "Sae") \{
    d = d * 2
  \} else if(n == "Jin" &amp;&amp; d &lt;= 2) \{
    d = d + 2
  \} else if(n == "Gim") \{
    d = d + 1
    if(d == 2) \{
      d = d * 4
      n = "Super Saiyan" + n
    \}
  \}
  return d
</pre>
  <p>You can treat the output of a function just like you would the output of any other command/plugin/etc in Perchance, so, for example, we can store the output of <code>calculateDamage()</code> and use it later:</p>
<pre>
output
  \[n = name.selectOne\] attacked and dealt \[d = calculateDamage()\] damage, which is \[d > 5 ? "high" : "low"\].
</pre>
  <p>The other cool thing we can do with functions is give them <b>inputs</b> which affect their output. Here's an example of a function that accepts a number as an input, and returns that number of animals, all joined together into one bit of text:</p>
<pre>
output
  Here are 3 animals: \[getAnimals(3)\], and here are 2 more: \[getAnimals(2)\].

animal = \{import:animal\}

getAnimals(num) =>
  return animal.selectMany(num).joinItems(" ")
</pre>
  <p>And a function can have multiple inputs by separating them with commas:</p>
<pre>
output
  Here are 3 animals joined with hyphens: \[getAnimals(3, "-")\], and here are 2 more joined with dollar signs: \[getAnimals(2, "$")\].

animal = \{import:animal\}

getAnimals(num, joiner) =>
  return animal.selectMany(num).joinItems(joiner)
</pre>
  <p><a href="https://perchance.org/function-with-2-inputs-example#edit" target="_blank">Here's an example generator</a> with that code.</p>
  <p>We haven't even scratched the surface of what's possible with functions, but hopefully this is enough to get you started. Feel free to ask questions on the <a href="https://lemmy.world/c/perchance" target="_blank">forum</a>!</p>
  <p>Note that the Perchance engine is based on JavaScript, so all JavaScript code is valid in Perchance functions (and also in square blocks). This is handy to know because you can search through JavaScript tutorials and cheatsheets if there's not much info on how to do something in Perchance (but always feel free to ask on the Perchance forum).</p>

	<h2 id="plugins" style="text-align:left;">Plugins</h2>

	<p>You may have seen the <a href="plugins">plugins</a> page already. This is just a list of handy "generators" (that aren't actually generators in the normal sense of the word) which you can import into your generator. Let's have a look at the <a href="dice-plugin">dice-plugin</a>, in particular. This plugin allows you to generate dice rolls with standard dice notation. Here's how we could use it:</p>
<pre>
dice = \{import:dice-plugin\}
output
	You rolled a \[dice("1d6")\].
</pre>

	<p>We could make the output even better by assigning it to a variable and using some dynamic odds notation:</p>

<pre>
output
  You rolled a \[n = dice("1d6")\].\[response\]

response
	Congratulations! ^\[n == 6\]
	Oh well. ^\[n &lt; 3\]
	Cool. ^\[n &gt;=4 &amp;&amp; n &lt;= 5\]
</pre>

	<p>Regarding the <code>response</code> list, if you haven't learned about dynamic odds notation yet, that basically means: If <code>n</code> equals 6, output "Congratulations!" or if <code>n</code> is less than 3, output "Oh well." or if <code>n</code> is greater than or equal to 4 <b>and</b> less than or equal to 5, output "Cool.". The <code>&amp;&amp;</code> means "and".</p>

	<p>There are a bunch of potentially useful plugins over on the <a href="plugins">plugins page</a> that you should check out. If you need someone to write you a plugin, feel free to ask on the <a href="https://lemmy.world/c/perchance">forum</a>.</p>


	<h2 id="hiding_square_block_outputs" style="text-align:left;">Executing &amp; Hiding the Result</h2>

	<p>Let's say you've got some code like this:</p>
<pre>
dice = \{import:dice-plugin\}

output
  \[a=dice("1d6"), b=dice("1d6"), c=dice("1d6"), ""\]If a+b+c is \[a+b+c\], and a is \[a\], and b is \[b\], then what is c? (Answer: \[c\])
</pre>

  <p>Here we're importing the dice plugin, using it to initialize some variables (but hiding them by adding <code>,""</code> at the end of the initialisation block), and then using those variables in the output text.</p>

  <p>But It's a little bit messy having all our variable initalizations at the start of our output, what what if we pull them out into their own list and reference them like this?

<pre>
init
  \[a=dice("1d6"), b=dice("1d6"), c=dice("1d6")\]

output
  \[init, ""\]If a+b+c is \[a+b+c\], and a is \[a\], and b is \[b\], then what is c? (Answer: \[c\])
</pre>

  <p>Will that work? It <i>looks</i> like it will work, but it actually won't. Let's think about what's happening here. When we write <code>\[init, ""\]</code> we're not actually "doing" anything with the <code>init</code> list. We're just "mentioning" it. We're not "executing" it - that is, we're not selecting an item from it and evaluating the square and curly blocks to produce some text. <i>Nothing</i> at all happens if you just "mention" a list name like that.</p>
  <p>But you're probably thinking: Wait, but when we write <code>\[animal\]</code> to get a random item from our (hypothetical) <code>animal</code> list, then we're just "mentioning" the animal list, right? And that type of mention <i>does</i> "execute" the list (i.e. it selects an item and converts it to plain text by evaluating square and curly blocks). Yes! That is correct. But it only does this because the last thing in that <code>\[animal\]</code> square block (and of course the <i>only</i> thing in it) is a list, and so that's what is actually going to get output, and so it needs to be converted into some text, so the Perchance engine "realizes" this and automatically executes the <code>.evaluateItem</code> command on the <code>animal</code> list, which triggers <code>selectOne</code> and then evaluates all the square and curly blocks in the resulting item.</p>

  <p>Okay, that was a bit of a mouthful. In summary: If the final thing in a square block is a list, then Perchance does some ✨magical✨ stuff behind the scenes to convert that list into plain text (which of course involves evaluation of square/curly blocks).</p>

  <p>If we want a list to be executed that's <b>not</b> the final thing in a square block, then we need to handle that ourself. Here's one way to fix the above example:</p>

<pre>
init
  \[a=dice("1d6"), b=dice("1d6"), c=dice("1d6")\]

output
  \[init.evaluateItem, ""\]If a+b+c is \[a+b+c\], and a is \[a\], and b is \[b\], then what is c? (Answer: \[c\])
</pre>

  <p>As you can see, we can use the <code>.evaluateItem</code> command on any lists that we want to "execute" behind the scenes. <a href="https://perchance.org/executing-and-hiding-result-example#edit" target="_blank">Here's an example generator</a> based on that code.</p>

  <p>The important thing to remember here is that if a list isn't the last thing in a square block, it won't get "executed" automatically. "Mentioning" a list name doesn't do anything. Use <code>.evaluateItem</code> to manually "execute" the list as needed.</p>

  <p>Here's another way to solve it:</p>

<pre>
init
  \[a=dice("1d6"), b=dice("1d6"), c=dice("1d6"), ""\]

output
  \[init\]If a+b+c is \[a+b+c\], and a is \[a\], and b is \[b\], then what is c? (Answer: \[c\])
</pre>

	<p>Since the block at the start of our <code>output</code> now has the <code>init</code> list as the <i>final</i> item, it will be magically executed "behind the scenes".</p>

	<p>There is another way to solve this that you probably didn't expect. It involves a fairly subtle feature of Perchance that is worth understanding if you're building complex generators.</p>

<pre>
init = \[a=dice("1d6"), b=dice("1d6"), c=dice("1d6")\]

output
  \[init, ""\]If a+b+c is \[a+b+c\], and a is \[a\], and b is \[b\], then what is c? (Answer: \[c\])
</pre>

  <p>You're probably looking at that and saying "But isn't that just the same as the first example? Using the equals sign like that is just a short-hand for a single-item list, right?" Well, most of the time, yes, but if the "single item" of this "list" is a <b><i>single</i> square block</b> (like it is in this case), then mentioning the name of this "list" will trigger an execution of that square block.</p>
  <p>So, really, if you use the "equals" single-item short-hand with an item that is just one square block, then you're creating what might be called a "random variable" or "dynamic variable" rather than a "list". So whenever you "mention" this variable, a new dynamic value is generated. That's why the above example works.</p>

	<h2 id="the_this_keyword" style="text-align:left;">The <code>this</code> Keyword</h2>
	<p>Have a look at this example:</p>
<pre>
personHeight = \{100-200\}
personEyeColor = \{brown^3|blue|grey^0.2|green^0.3\}
personDescription = The person is \[personHeight\]cm tall and has \[personEyeColor\] eyes.
</pre>
	<p>There's nothing wrong with this example, but we could use a hierarchy to clean it up a bit and make it more "modular":</p>
<pre>
person
	height = \{100-200\}
	eyeColor = \{brown^3|blue|grey^0.2|green^0.3\}
	description = The person is \[person.height\]cm tall and has \[person.eyeColor\] eyes.
</pre>
  <p>That's much nicer because now all the person-related things are all nested under one label: <code>person</code>. Now, instead of writing <code>\[personDescription\]</code>, we'd write <code>\[person.description\]</code>. This organisational "nesting" would be especially helpful if we had a fairly complex generator with lots of things to keep track of. Writing neat code allows us to create more complex generators with less effort.</p>
	<p>But we can actually make one final tweak which makes <code>person</code> just a little bit neater and more self-contained:</p>
<pre>
person
	height = \{100-200\}
	eyeColor = \{brown^3|blue|grey^0.2|green^0.3\}
	description = The person is \[this.height\]cm tall and has \[this.eyeColor\] eyes.
</pre>
	<p>Notice how we've written <code>this.height</code> instead of <code>person.height</code>? That's because the special <code>this</code> keyword always refers to the "parent" of the item that it is written in. In this case the "parent" of <code>description</code> is <code>person</code>, so writing <code>this</code> is the same as writing <code>person</code>.</p>
	<p>If we use <code>this</code>, instead of <code>person</code>, then our code is more "modular" or "self-contained", because, for example, the <code>description</code> doesn't care what its parent is called - we could rename <code>person</code> to <code>human</code> and it would still do its job correctly without worrying about looking for all the times we mentioned <code>person</code> and changing them to <code>human</code>.</p>

	<p>The <code>this</code> keyword is also useful when you've got a very "deep" hierarchy:</p>

<pre>
race
	humanoid
		elf
			height = \{10-20\}0cm
			description = It's an Elf that's about \[this.height\]cm tall.
			...
		orc
			...
				...
		...
	...
</pre>

	<p>See how we can use <code>this.height</code> instead of <code>race.humanoid.elf.height</code>? It's neater and more self-contained.</p>

	<p>So the <code>this</code> keyword allows us to access the parent of the current item, but what if we want to access the <i>parent's parent</i>? This is where we use the <code>getParent</code> property. While the <code>selectOne</code> property allows us to move <i>down</i> the hierarchy by selecting a random child, the <code>getParent</code> property allows us to move <i>up</i> the hierarchy by getting an item's parent.</p>

<pre>
cake
	flavor = \{strawberry|dark chocolate|vanilla\}
	description
		A tasty \[this.getParent.flavor\] cake.
		A \[this.getParent.flavor\] cake that is tasty.
</pre>

	<p>See how that works? The <code>this</code> keyword always refers to the item's parent - <code>description</code>, in this case. We add <code>.getParent</code> after <code>this</code> because we want to get the parent of <code>description</code> (which is <code>cake</code>). Finally, we add <code>.flavor</code> because we want to get the flavor property of <code>cake</code>.</p>

	<p>Now that you understand <code>this</code> and <code>.getParent</code> you can go up and down the hierarchy as you please! 🎉</p>

  <p>One final tip: To get the name of a list, you can use <code>.getName</code>, and this can be "chained" with <code>.getParent</code> like so:</p>

<pre>
output
  \[animal.selectOne.selectOne.description\]

animal
	mammal
    mouse
      description = a \[this.getName\] is a type of \[this.getParent.getName\]
    kangaroo
      description = a \[this.getName\] is a type of \[this.getParent.getName\]
	reptile
    lizard
      description = a \[this.getName\] is a type of \[this.getParent.getName\]
    turtle
      description = a \[this.getName\] is a type of \[this.getParent.getName\]
</pre>
  <p>So that'll output something like "a turtle is a type of reptile" as you can see in <a href="https://perchance.org/getparent-getname-example#edit" target="_blank">this example generator</a>. That's probably not the neatest way to achieve it (due to lots of repetition), but it gets the point across :)</p>



	<h2 id="createInstance_plugin" style="text-align:left;">The <code>createInstance</code> Plugin</h2>
	<p><b>Note:</b> This section was written before the createInstance plugin page had a decent explanation on it. There's a good explanation over there now, so if you head over to <a href="https://perchance.org/create-instance-plugin">the plugin page</a> and read it first, it may be easier to understand, since it starts off with a more simple example.</p>
	<p>Let's create a simple <code>person</code> "list":</p>

<pre>
person
	height = \{10-20\}0
	eyeColor = \{brown^3|blue|grey^0.2|green^0.3\}
	sex = \{male|female\}
	pronoun
		she ^\[this.getParent.sex == "female"\]
		he ^\[this.getParent.sex == "male"\]

</pre>

	<p>The above <code>person</code> "list" not really a list, because it doesn't have any items - it only has "properties", and a sub-list. So we can write <code>person.eyeColor</code> and we'll get a random eye color, or <code>person.height</code>, and we'll get a random person height.</p>
	<p>As a side node: Notice that we're using <i>dynamic</i> odds to determine the probability of each pronoun. If you haven't learned about dynamic odds notation yet, you can scroll up the the Dynamic Odds section on this page to learn about it. The special <code>this</code> keyword always refers to the item's parent. So this this case <code>this</code> refers to the <code>pronoun</code> item. So <code>this.getParent</code> refers to the parent of the <code>pronoun</code> item: <code>person</code>. If this all sounds too complicated, don't worry too much about that for now - you don't need to know this stuff to use the plugin. Just know that the odds of each item in the <code>person.pronoun</code> list depends on what <code>person.sex</code> evaluates to.</p>
	<p>Okay, so what if we wanted to use this <code>person</code> "list" as a sort of "blueprint" to generate a random person that we could store in a variable and reference multiple times? So if we could create a particular random "instance" of this <code>person</code> blueprint, and store it in a variable <code>p</code>, then each time we evaluate <code>p.eyeColor</code> we should get the <i>same</i> eye color, and each time we evaluate <code>p.name</code> we should get the <i>same</i> name.</p>
	<p>To do this, we need to use the <code><a href="create-instance-plugin">createInstance</a></code> plugin, and we'd use it like so:</p>

<pre>
createInstance = \{import:create-instance-plugin\}

person
	height = \{10-20\}0
	eyeColor = \{brown^3|blue|grey^0.2|green^0.3\}
	sex = \{male|female\}
	pronoun
		she ^\[this.getParent.sex == "female"\]
		he ^\[this.getParent.sex == "male"\]

output
	\[p = createInstance(person), ""\]If I recall correctly \[p.pronoun\] was about \[p.height\]cm tall. Yes, and \[p.pronoun\] definitely had \[p.eyeColor\] eyes.
</pre>

	<p>You can create as many instances of the <code>person</code> blueprint as you want, and just store them in separate variables like so:</p>

<pre>
\[p1 = createInstance(person), p2 = createInstance(person), ""\]
</pre>

	<p>Each instance will have its own set of randomly selected values. The <code>createInstance</code> plugin essentially runs <code>selectOne</code> on each of the properties of the list that you pass it, and then "fixes" those values in place. But note that it doesn't change the original list in any way - it creates a completely new one each time.</p>

	<p>Check out <a href="create-instance-plugin-example#edit">this generator</a> for another example of how to use the <code>createInstance</code> plugin.</p>




	<h2 id="dynamic_sublist_referencing" style="text-align:left;">Dynamic Sub-list Referencing</h2>

	<p>Have a look at this simple generator:</p>

<pre>
output
	My gender is \[g = gender.selectOne\] and my name is \[names.<span style="color:red">g</span>.selectOne\].

gender = \{female|male|non-binary^0.1\}

names
	female
		Anita
		Jessica
	male
		Kalid
		Bob
	non-binary
		Airlie
		Riley
</pre>

	<p>But there's something wrong with this generator - I've marked it red. What I wanted to do here is use the correct sublist of <code>names</code> depending on what is stored in the <code>g</code> variable. As it currently stands, this generator would throw us an error because there's no "g" sublist in the <code>names</code> names list; <code>names.g</code> doesn't exist.</p>
	<p>So how do we do this? We just want to get sublist of <code>names</code> that has the same name as the value stored in the <code>g</code> variable. Before I present the solution, I want to re-iterate something that you learned in the basic tutorial: Square brackets have a completely different meaning when they're used <i>inside</i> square brackets. When you're inside square brackets you can refer to variables and lists directly by their names, so:</p>
	<ul>
		<li>This is <b style="color:red">wrong</b>: \[a = \[animal\].selectOne\]</li>
		<li>This is right: \[a = animal.selectOne\]</li>
	</ul>
	<p>Makes sense? We don't need to use square brackets to refer to lists and variables when we're already inside square brackets.</p>
	<p>The reason I wanted to re-iterate that is because you're about to learn one of the <i>actual uses</i> of square brackets <i>inside</i> square brackets. Without further ado, here's the solution to our previous problem:</p>

<pre>
output
	My gender is \[g = gender.selectOne\] and my name is \[names<span style="color:#00cc00">\[g\]</span>.selectOne\].
</pre>

	<p>So we've replaced <code><span style="color:red">.g</span></code> with <code><span style="color:green">\[g\]</span></code>. This tells the Perchance engine to use the <i>value</i> stored in <code>g</code> as the name of the sublist, rather than using the literal character "g". So if the value in <code>g</code> was "other", then writing <code>name\[g\]</code> would be the same as writing <code>name.other</code>.</p>
	<p>Remember, these square brackets are part of a special notation that is completely different to normal usage of square brackets.</p>
	<p>Often we need to "chain" sub-property names together to go down a hierarchy: <code>world.continent.country.state.city</code> - and we can do the same thing with our dynamic notation: <code>world\[a\]\[b\]\[c\]\[d\]</code>, and we can mix and match normal and dynamic notations: <code>world\[a\].country\[b\]\[c\].town</code>.</p>
	<p>Sometimes you may find that you need to combine variables to create your property names. You can do that like so: <code>thing\[a+b\]</code>. That will join <code>a</code> and <code>b</code> together, and then get the sublist of <code>thing</code> with that name (if it exists). You can also combine variables with literal strings like this: <code>thing\[a+"blah"\]</code>. So if the value of <code>a</code> was "foo", then that would be the same as writing <code>thing\["fooblah"\]</code>, which would be the same as writing <code>thing.fooblah</code>.</p>
	<p><a href="https://perchance.org/dynamic-sublist-referencing-example#edit" target="_blank">Here's a simple generator</a> that selects a random gender and then uses that to select an appropriate appearance for a character. And <a href="https://perchance.org/matching-pronouns-with-genders-example#edit" target="_blank">here's another</a> that matches genders with the correct pronouns. <a href="https://perchance.org/dynamic-sub-list-referencing-example#edit" target="_blank">And here's</a> a very simple example.</p>



	<h2 id="$output" style="text-align:left;">The <code>$output</code> Keyword</h2>
	<p>We can use the <code>$output</code> keyword to "export" a specific list within our generator:</p>
<pre>
$output = \[material\]

material
	wood
	metal
	plastic
	...
</pre>
	<p>So now when people "import" your generator with <code>\{import:your-generators-name\}</code>, they'll get a random item from the <code>material</code> list.</p>
	<p>But we can also use the <code>$output</code> keyword <i>within lists</i> so the list "exports" something when we evaluate it. Here's a simple usage example:</p>
<pre>
person
	age = 68
	name = Anita
	$output = My name is \[this.name\] and I'm \[this.age\]
</pre>
	<p>Now when you write <code>\[person\]</code> it'll output <code>My name is Anita and I'm 68</code>. <a href="/output-keyword-example#edit">Try it out</a>. See how it works? We can use <code>$output</code> to <i>change</i> what a list outputs! Note that we can still write <code>\[person.age\]</code> and <code>\[person.name\]</code> to get "68" and "Anita", respectively.</p>
	<p>If you think about it, when we use <code>$output</code> for exporting a certain list (so people can <code>import</code> it) we're doing the same thing, except we're changing what the <i>whole generator</i> outputs.</p>
	<p>You might be thinking: "Is <code>$output</code> <i>really</i> necessary in the above example?" And you're right - we could have just wrote this:</p>
<pre>
person
	age = 68
	name = Anita
	description = My name is \[this.name\] and I'm \[this.age\]
</pre>
	<p>And then used <code>\[person.description\]</code> instead. It's a bit longer than just writing <code>\[person\]</code>, but at least we don't need to use quirky and potentially confusing features. But <code>$output</code> actually turns out to be really helpful for some more advanced techniques. For example, we normally use the <code>&lt;br&gt;</code> tag to insert a new line in our text (to generate multi-line content), but that can get a little messy because you can end up with really long lines. Using <code>$output</code> we can automatically <a href="/multiline-pro-simple-example#edit">combine all the items in a list</a> together, rather than selecting a random one. <a href="https://www.reddit.com/r/perchance/comments/fo3ige/make_a_large_multiline_output_lots_of_brs_easier/" target="_blank">Here's an explanation</a> of how that works.</p>
	<p>As you start to learn these more advanced features, you'll do well to think of your generator as a <b>hierarchy</b>, rather than just a bunch of lists. Perchance allows you to go as many levels deep as you want, and you can alter the <code>$output</code>s at each level.</p>





	<h2 id="multiple_independent_outputs" style="text-align:left;">Multiple Independent Outputs</h2>
	<p>Sometimes you'll want to have two different "randomized" outputs that are randomized via <b>separate</b> buttons. So, for example, you may be generating a random book title and author name, but you want separate buttons to randomize each of those, rather than a single button that does both. I'll explain this below, but to achieve this, you need to add an <code>id="blahblah"</code> attribute to the HTML element that contains your different <code>\[output\]</code> blocks. You can set each <code>id</code> to any name you like so long as it starts with a letter and doesn't contain any spaces. We'll reference these <code>id</code>s later to tell the Perchance engine which elements to update when a particular button is pressed. Here's an example of two elements we could have in our HTML panel:</p>
<pre>
&lt;p&gt;\[output1\]&lt;/p&gt;
&lt;p&gt;\[output2\]&lt;/p&gt;
</pre>
	<p>Now, let's add <code>id</code> attributes to these elements so we can reference them later. We'll call them <code>out1</code> and <code>out2</code>:</p>
<pre>
&lt;p id="out1"&gt;\[output1\]&lt;/p&gt;
&lt;p id="out2"&gt;\[output2\]&lt;/p&gt;
</pre>
	<p>And now you'll want to create a "randomize" button for each of those two elements, rather than a single randomize button that updates both. First, here's how we'd create a normal randomize button that updates both at the same time:</p>
<pre>
&lt;button onclick="update()"&gt;randomize&lt;/button&gt;
</pre>
	<p>And now here's how we create two different buttons which update our <code>out1</code> and <code>out2</code> elements separately:</p>
<pre>
&lt;button onclick="update(out1)"&gt;randomize&lt;/button&gt;
&lt;button onclick="update(out2)"&gt;randomize&lt;/button&gt;
</pre>
	<p>Notice that we simply put the <code>id</code> of the element that we want to update inside the brackets of the <code>update</code> function. The full explanation of this is outside the scope of this tutorial, but if you learn some JavaScript, you'll see that there's nothing too complicated happening here. So here's the full code that you'd put in your HTML panel:</p>
<pre>
&lt;p id="out1"&gt;\[output1\]&lt;/p&gt;
&lt;button onclick="update(out1)"&gt;randomize&lt;/button&gt;

&lt;p id="out2"&gt;\[output2\]&lt;/p&gt;
&lt;button onclick="update(out2)"&gt;randomize&lt;/button&gt;
</pre>
  <p>And your Perchance code panel might look like this:</p>
<pre>
output1
  mouse
	frog
	moose

output2
  broccoli
	cabbage
	spinach
</pre>
	<p>So now, when the user clicks the top button, only the top (<code>out1</code>) element will be updated, and when they click the bottom button, the bottom element (<code>out2</code>) will be updated. <a href="https://perchance.org/multiple-independent-outputs-example#edit" target="_blank">Here's an example generator</a> that puts all this stuff together. And <a href="https://perchance.org/multiple-independent-outputs-example-2#edit" target="_blank">here's another</a>.</p>
	<p>Note that you can add the <code>id</code> attribute alongside any existing attributes like <code>style</code> that you may already have:</p>
<pre>
&lt;p style="color:blue;" id="out1"&gt;\[output1\]&lt;/p&gt;
</pre>
	<p>If you'd like multiple buttons, but for them to output to the <i>same spot</i> (so only one output shows up at a time), then check out <a href="https://perchance.org/multiple-buttons-same-output#edit" target="_blank">this example</a>. What we're doing in that example is setting a <code>clicked</code> variable whenever the user clicks one of the buttons. If they click the plant button, we set it to "plant", and if they click the animal button we set it to "animal". Then we check the value of the <code>clicked</code> variable in our output list using "dynamic odds".</p>

	<h2 id="battle_simulator" style="text-align:left;">Battle Simulator</h2>
	<p>The <a href="/battle-simulator-example#edit">battle-simulator-example</a> uses a few sneaky Perchance features. Let's have a look at the <code>turn</code> list:</p>
<pre>
turn
	\[character.hp -= 5, ""\]You were hit in the torso with a stone.
	\[character.hp += 20, ""\]A nearby priest heals your wounds. ^0.1
	...
</pre>
	<p>See how each item has something like <code>\[character.hp -= 5, ""\]</code> before it? What's happening here? Well, <code>-= 5</code> just means "subtract five from this variable". So we're just decreasing the character's hitpoints by 5 each time that first item is randomly selected and consequently "evaluated".</p>
	<p>Now, to understand the comma and double quotation marks, we need to understand some fundamental stuff about Perchance: You can put multiple commands/variables inside square brackets so long as you separate them by a comma - and importantly <i>Perchance will only print out the result of the <b>last</b> command</i>. So it executes all the commands, but only prints out the last one. Here our last command was an "empty" command. We're just telling it to print out nothing. If we'd written <code>\[character.hp -= 5, "apple"\]</code>, then it'd print out the text "apple" in the place of that square block. If we wrote <code>\[character.hp -= 5, character.name\]</code>, then it'd print out the character's name. You'll use the <code>\[command, ""\]</code> pattern a lot in your Perchance travels to sneakily execute commands behind the scenes without actually outputting anything.</p>
	<p>Our next lesson from this generator is the dynamic odds notation <code>^\[character.hp &gt; 0\]</code>. Here we're using what are called "<a href="https://en.wikipedia.org/wiki/Boolean_expression">boolean expressions</a>". The expression <code>1 &gt; 100</code> means "1 is greater than 100" - which is false. One is definitely not greater than one hundred. So this expression evaluates to "false", which is equivalent to the number 0 in Perchance odds notation. So if you wrote <code>^\[1 &gt; 100\]</code> after an item, it'd always get a weight of 0 - which means it's impossible. There's no use in even having an item with those odds in the list! On the other hand, if you wrote <code>^\[1 &lt; 100\]</code>, then the statement is "1 is less than 100" which evaluates to true, which is equivalent to 1. So you might as well just write <code>^1</code> - but that's the default value anyway! As you can see, dynamic odds notation is not so useful unless you're using "variables" (things that can vary) like <code>character.hp</code>.</p>
	<p>So if the expression after <code>^</code> is true, it gets a weight of one. Conversely if the expression is false, it gets a weight of zero (equivalent to writing <code>^0</code> after the item). There are 4 different boolean "operators" of the greater/less than variety:</p>
	<ul style="text-align:left;">
		<li><code>&lt;</code> means less than</li>
		<li><code>&gt;</code> means greater than</li>
		<li><code>&lt;=</code> means less than or equal to</li>
		<li><code>&gt;=</code> means greater than or equal to</li>
	</ul>
	<p>So coming back to our original expression: <code>^\[character.hp &gt; 0\]</code>, this just means "give this item a weight of 1 if <code>character.hp</code> is greater than one, otherwise give it a weight of 0". Remember that dynamic weights don't have to be boolean expressions. They can just be references to other variables like <code>^\[character.age\]</code> or something like that.</p>
	<p>There is one final pro technique used in this generator. Can you see what it is? Notice that the first item in the <code>battle</code> list contains a reference to the <code>battle</code> list itself!</p>

<pre>
battle
	\[turn\]&lt;br&gt;\[status\]&lt;br&gt;\[battle\] ^\[character.hp &gt; 0\]
	It's over. ^\[character.hp &lt;= 0\]
</pre>

	<p>What on earth is going on there?! Well, firstly, <code>&lt;br&gt;</code> is just how you output a "line <b>br</b>eak" (new line) in HTML. That ensures that each step of the battle is printed on it's own line. Secondly, the "self-referential" behaviour of this <code>battle</code> list isn't too hard to understand once we put it in plain English: "Keep doing the battle until the character's health is zero or lower, then output <code>It's over.</code>". So we evaulate <code>\[battle\]</code> <i>once</i> and it will select the first item because the character's <code>hp</code> is above zero, then it executes a <code>\[turn\]</code>, then prints the <code>\[status\]</code>, then calls <code>\[battle\]</code> which repeats the process again. This keeps happening until the character's health falls below zero - at which point the second item, <code>It's over.</code> is chosen and the loop stops. Pretty neat, huh? <a href="https://www.reddit.com/r/perchance/comments/8rrnwd/is_it_possible_to_set_items_to_have_values_and/">Here's another example</a> where you might want to use loops (see @syrupyeti's reply).</p>

	<p>Note that when you're creating "loops" like this, its easy to accidentally create an "infinite loop", which may freeze up the browser tab. It freezes up the browser tab because the infinite loop is trying to execute the loop millions of times, and potentially trying to output way too much text. This won't harm your computer (you can just close the tab), but if you're not saving often, you may lose some work because you can't save a generator while it's in this "frozen" state. So make sure you're saving often. If you do accidentally freeze up your generator, but you've saved it with the infinite loop code (so everytime you visit the page it immediately freezes up) then you can prevent your code from executing by putting <code>#debugFreeze</code> at the end of your generator's URL. For example:</p>

<pre>https://perchance.org/your-generators-name#debugFreeze</pre>

  <p>This will open up the editor panel and prevent it from executing your code, so you've got a chance to make the required edits to stop the infinte loop, and then you can save it.</p>


	<h2 id="more_examples" style="text-align:left;">More Examples</h2>
	<ul>
    <li><a href="https://perchance.org/tags-and-header-meta-data-example">Use <code>$meta</code> to hide the Perchance header bar, or change its color/background</li>
    <li><a href="https://perchance.org/selectmany-sumitems-example"><code>selectMany</code> dice based on previous roll and use <code>sumItems</code> to get sum</a></li>
    <li><a href="https://perchance.org/roll-number-of-dice-based-on-previous-roll#edit">Roll number of dice based on previous roll</a></li>
		<li><a href="https://perchance.org/draw-a-river-example#edit">Draw a spatial grid/map with emojis</a></li>
		<li><a href="https://perchance.org/add-up-randomly-generated-numbers-example#edit">Add up randomly generated numbers</a></li>
		<li><a href="https://perchance.org/choose-a-list-based-on-a-selected-number#edit">Choose a list based on a randomly selected number</a></li>
		<li><a href="https://perchance.org/append-items-when-click-example#edit">Append items to list when button is clicked</a></li>
		<li><a href="https://perchance.org/output-history-example#edit">Prepend generated items to a "history" box</a></li>
		<li><a href="https://perchance.org/hide-output-until-click-example#edit">Hide the output until the user clicks a button</a> (<a href="https://www.reddit.com/r/perchance/comments/9mhnf1/generator_with_nothing/">explanation</a>)</li>
		<li><a href="https://perchance.org/select-leaf-plugin-example#edit">selectLeaf plugin</a></li>
		<li><a href="https://perchance.org/consumable-leaf-list-plugin-example#edit">"consumable" hierarchies</a></li>
		<li><a href="https://perchance.org/matching-pronouns-with-genders-example#edit">Matching pronouns based on gender</a>. The "Dynamic Sublist Referencing" section (above) explains this.</li>
		<li><a href="https://perchance.org/dice-game-example#edit">Dice game thing that uses an if/else block</a></li>
		<li><a href="https://perchance.org/passing-variables-to-lists-example#edit">Passing variables into lists</a> (<a href="https://www.reddit.com/r/perchance/comments/bgphrz/how_do_i_pass_variablesreferences_to_imported/elsgw5z" target="_blank">explanation</a>)</li>
		<li><a href="https://perchance.org/consumable-list-with-dynamic-odds-example#edit">Consumable List with Dynamic Odds</a> (<a href="https://www.reddit.com/r/perchance/comments/bhm9el/if_first_result_is_a_how_to_exclude_b_from_second/elu8uax" target="_blank">explanation</a>)</li>
		<li><a href="https://perchance.org/indented-html-in-your-lists-example#edit">Write list items with indented HTML</a></li>
		<li><a href="https://perchance.org/character-role-consumable-example#edit">Assign "roles" to a bunch of characters with a consumable list</a></li>
		<li><a href="https://perchance.org/consumable-list-with-nested-properties#edit">Using a consumable list with a list of items that have nested properties/lists (i.e. a hierarchy)</a></li>
		<li><a href="https://perchance.org/three-percentages-example#edit">Generate three numbers which all add up to 100</a></li>
		<li><a href="https://perchance.org/click-to-hide-show-text-example#edit">Click to unhide some hidden text (useful to show extra details)</a></li>
		<li><a href="https://perchance.org/custom-cursor-example#edit">Custom mouse cursor</a></li>
		<li><a href="https://perchance.org/counting-item-selections-example#edit">Counting the selections that are made from a list</a></li>
		<li><a href="https://perchance.org/simple-random-images-example#edit">Display a random image, given a list of URLs</a></li>
		<li><a href="https://perchance.org/simple-random-image-example-cropped#edit">Display a random image, cropped to 200x200 pixels, given a list of URLs</a></li>
		<li><a href="https://perchance.org/add-images-to-output#edit">Add an image to each list item so the image gets output alongside the text</a></li>
		<li><a href="https://perchance.org/random-image-with-name-example#edit">Display a random image along with your random text</a></li>
		<li><a href="https://perchance.org/random-images-example#edit">Display a random image along with your random text (a bit more complicated than the above example)</a></li>
		<li><a href="https://perchance.org/acronym-from-words-example#edit">Generate acronyms from words using a custom function</a></li>
		<li><a href="https://perchance.org/p5js-basic-example">A basic p5.js example (the JavaScript "library" taught on Khan Academy)</a></li>
		<li><a href="https://perchance.org/permutations-counter-example#edit">Calculate and display the total number of possible permutations/results that your generator has</a></li>
		<li><a href="https://perchance.org/income-by-city-example#edit">Use dynamic sub-list referencing to generate random incomes based on a randomly selected city</a></li>
		<li><a href="https://perchance.org/randomize-at-regular-intervals-example#edit">Randomize automatically at regular time intervals</a></li>
		<li><a href="https://perchance.org/future-presidents-example#edit">Generate sequential presidents with random terms (4 or 8 years) such that the years don't overlap</a></li>
		<li><a href="https://perchance.org/if-else-in-dynamic-odds-example#edit">Using If/Else within dynamic odds statements</a></li>
		<li><a href="https://perchance.org/generate-based-on-seed-keyword#edit">Always generate the same thing based on a particular "seed" keyword (uses seeder-plugin)</a></li>
		<li><a href="https://perchance.org/multiple-outputs-random-number-of-items-example#edit">Multiple independent outputs with random numbers of items generated in each</a></li>
		<li><a href="https://perchance.org/lineage-of-kings-example#edit">Generate a lineage of kings with correctly-sequential roman numeral names</a></li>
		<li><a href="https://perchance.org/color-picker-example#edit">Basic example using a color picker input</a></li>
		<li><a href="https://perchance.org/fuel-consumption-distance#edit">Use inputs to calculate distance traveled based on fuel remaining and fuel consumption rate</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/f8dau1/fahrenheit_to_celcius/fimoau9/">Convert Fahrenheit to Celcius, and vice versa. Also, miles to kilometers and vice versa.</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/fognc2/how_to_pick_a_sublist_and_continue_to_draw_from_it/">Select a sublist from a list, and then get that sublist's "name" using sublist.getName</a></li>
		<li><a href="https://perchance.org/commas-in-numbers-example#edit">Display numbers with commas - like 974,384,837 instead of 974384837</a></li>
		<li><a href="https://perchance.org/exclude-item-based-on-previous-selection#edit">Exclude an item from a list based on a previous selection</a></li>
		<li><a href="https://perchance.org/change-item-odds-based-on-selections-parent#edit">Change the odds of an item based on a previous selection's parent</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/g2uwh1/can_i_add_a_button_to_clear_generated_text_can/fo1ghye">Make output text editable (e.g. so users of your generator can customize before screenshotting)</a></li>
		<li><a href="https://perchance.org/change-output-based-on-screen-size-example#edit">Change output based on user's screen size</a></li>
		<li><a href="https://perchance.org/bingo-table-example#edit">Bingo table example using make-table-plugin</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/gffusa/replace_certain_strings/">Find and replace text using regex</a></li>
    <li><a href="https://www.reddit.com/r/perchance/comments/sytskh/renaming_a_specific_set_of_events/">Replacing/renaming certain combinations of outputs with some new text</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/gjevx1/text_orientation/">Use CSS to change make the text align left instead of center</a></li>
		<li><a href="https://perchance.org/get-median-of-numbers-example#edit">Get the median of some randomly generated numbers</a></li>
		<li><a href="https://perchance.org/filter-exclude-item-from-list#edit">Filter/exclude an item from a list</a></li>
		<li><a href="https://perchance.org/seed-from-url-example#edit">Embed a randomness "seed" in the URL of your generator</a></li>
		<li><a href="https://perchance.org/pass-variable-via-url-example?type=veg">Pass a variable to your generator via the URL</a></li>
		<li><a href="https://perchance.org/user-controls-how-many-outputs-example#edit">Add a input box that allows the user to choose how many outputs they get</a></li>
		<li><a href="https://www.reddit.com/r/perchance/comments/ihwsx9/how_do_i_make_it_so_there_are_multiple_outputs/">Another example of an input box that lets you choose how many items to output</a></li>
		<li><a href="https://perchance.org/remember-user-inputs-basic-example#edit">Remember the user inputs (drop-downs, text boxes, etc.) so you can close the tab or refresh it and it keeps the values</a></li>
		<li><a href="https://perchance.org/click-counter#edit">A simple click counter</a></li>
		<li><a href="https://perchance.org/click-counter-2#edit">Another simple click counter approach</a></li>
		<li><a href="https://perchance.org/increment-counter-when-specific-items-is-selected-example#edit">Increment a counter when a specific items is selected</a></li>
		<li><a href="https://perchance.org/increment-counter-caves-example#edit">Increment a counter to label each generated item with a number</a></li>
		<li><a href="https://perchance.org/generate-colored-text-example#edit">Generate colored text</a></li>
		<li><a href="https://perchance.org/custom-image-button-example#edit">Use a custom image as a button</a></li>
		<li><a href="https://perchance.org/custom-image-button-with-hover-example#edit">Use an image as a button and change the button when they hover and click</a> (And <a href="https://perchance.org/simple-mouse-hover-image-change-example#edit" target="_blank">here's a simpler version</a> with only a hover effect)</li>
		<li><a href="https://perchance.org/metadata-example#edit">Add a title, description and image to your generator so that when you share it as a link on social media, it has a nice link preview</a></li>
		<li><a href="https://perchance.org/different-result-on-first-load#edit">Display a specific result (rather than a random one) when the page is loaded</a></li>
    <li><a href="https://perchance.org/different-items-depending-on-num-clicks#edit">Display different results depending on how many times they've clicked the "randomize" button</a></li>
    <li><a href="https://perchance.org/show-specific-text-on-first-load#edit">Show a message that only comes up when the page first loads</a></li>
		<li><a href="https://perchance.org/persistent-consumable-list-example#edit">A consumableList that doesn't get "reset" each time the randomize button is clicked</a></li>
		<li><a href="https://perchance.org/add-items-to-list-example#edit">Add items to a list when a button is clicked</a></li>
		<li><a href="https://perchance.org/map-example#edit">Use .map to convert a whole list of items into their sub-properties/items</a></li>
		<li><a href="https://perchance.org/multiple-output-results-option#edit">Add an input box that lets you choose a specific number of items to output</a></li>
		<li><a href="https://perchance.org/tap-image-to-randomize#edit">Combining the tap-plugin and random-image-plugin to make an image randomize when you tap it</a></li>
		<li><a href="https://perchance.org/first-n-items-of-random-sub-list#edit">Select a random sub-list and then get the first N items of that sub-list, where N is a randomly chosen number</a></li>
		<li><a href="https://perchance.org/consumable-list-that-stays-consumed-until-refresh#edit">Draw from a deck of cards with a button and use another button to reshuffle the deck when all cards have been drawn</a></li>
		<li><a href="https://perchance.org/numbered-outputs-example-manual#edit">Sequentially numbered outputs</a></li>
		<li><a href="https://perchance.org/numbered-outputs-with-html-ol#edit">Another sequentially numbered outputs example, but using HTML's <code>ol</code> tag</a></li>
		<li><a href="https://perchance.org/text-contains-text-example#edit">Check if some text contains some other text and change the probability of an item based on whether it does</a></li>
		<li><a href="https://perchance.org/add-user-inputs-to-list-example#edit">Add two user inputs to a list</a></li>
		<li><a href="https://perchance.org/user-input-list-append-example#edit">Add many user inputs to a list</a></li>
		<li><a href="https://perchance.org/user-input-list-example#edit">Allow the user to create a new list with their inputs</a></li>
		<li><a href="https://perchance.org/update-dynamically-generated-elements-example#edit"><code>update()</code>ing dynamically generated elements</a></li>
		<li><a href="https://perchance.org/image-layer-combiner-thumbnail-generator-example#edit">Use the image-layer-combiner-plugin to generate random video thumbnails based on a generated video title</a></li>
		<li><a href="https://perchance.org/using-name-of-selected-sublist-example#edit">Selecting a sublist and using its name, and then selecting an item from that sublist</a></li>
		<li><a href="https://perchance.org/changing-drop-down-without-user-click-example#edit">Changing a drop-down list's current value without the user clicking it</a></li>
		<li><a href="https://perchance.org/multi-dropdown-user-provided-pattern#edit">Use multiple drop-down lists to allow the user to define a pattern that is used to generate the output</a></li>
		<li><a href="https://perchance.org/generate-drop-down-input-from-hierarchical-list#edit">Generate a drop-down user input from a hierarchical list</a></li>
		<li><a href="https://perchance.org/use-seeder-plugin-for-one-import-only-example#edit">Use the seeder plugin for one import or list only (the others stay completely random)</a></li>
		<li><a href="https://perchance.org/dynamically-creating-a-list-and-adding-items-to-it#edit">Dynamically creating a list and adding items to it</a></li>
		<li><a href="https://perchance.org/filter-list-based-on-instance-properties-example#edit">Filter a list based on generated instance properties</a></li>
		<li><a href="https://perchance.org/filter-a-list-of-generated-instances-example#edit">Generate a list of instances and then filter them based on their properties</a></li>
		<li><a href="https://perchance.org/damage-roll-function-example#edit">Use a simple custom function to roll a dice and calculate damage, and count the number of rolls above 3</a></li>
		<li><a href="https://perchance.org/randomize-on-tap-with-optional-subtap#edit">Tap some text to randomize only that text (similar to tap-plugin), but a tappable sub-item appears sometimes.</a></li>
		<li><a href="https://perchance.org/combine-multiple-lists-into-one-consumable-list#edit">Combine multiple lists into a single consumable list</a></li>
		<li><a href="https://perchance.org/list-method-with-createinstance-example#edit">Add a function within a list and create an instance of that list</a></li>
		<li><a href="https://perchance.org/combining-list-that-contain-duplicates-without-selecting-duplicates#edit">Combining list that contain duplicates without selecting duplicates</a></li>
		<li><a href="https://perchance.org/question-and-answer-example#edit">User inputs text in a text box to see if their answer to the question is correct</a></li>
		<li><a href="https://perchance.org/select-the-highest-number#edit">Select the highest number from a set of randomly generated numbers</a></li>
		<li><a href="https://perchance.org/curly-brackets-within-square-brackets-alternatives-example#edit">Using curly brackets inside square brackets</a></li>
		<li><a href="https://perchance.org/array-of-instances-within-instance-example#edit">An array of instances within a single instance using the createInstance and createInstance<b>s</b> plugins</a></li>
    <li><a href="https://perchance.org/sequential-pages-example#edit">Sequential "pages" example. Clicking a button brings you to the next page of content.</a></li>
    <li><a href="https://www.reddit.com/r/perchance/comments/sdlgzf/comment/huf9ov2/">selectMany/selectAll, and then transform all the selected list items using a simple instruction like <code>item => item.upperCase</code></a></li>
    <li><a href="https://perchance.org/randomize-image-color-example#edit">Randomize the colors of an image using a CSS filter</a></li>
    <li><a href="https://perchance.org/curly-blocks-inside-square-blocks#edit">Using curly blocks (e.g. <code>\{1-5\}</code>) inside square blocks</a></li>
    <li><a href="https://www.reddit.com/r/perchance/comments/v5p525/comment/ibm6j1m">HTML for generating bullet-point lists</a></li>
    <li><a href="https://perchance.org/prevent-randomization-of-list-except-at-page-reload#edit">Prevent randomization of list except at page reload</a></li>
    <li><a href="https://perchance.org/track-selections-display-other-properties-of-selected-items-later#edit">Track selections &amp; display other properties of selected items later</a></li>
    <li><a href="https://perchance.org/spoiler-hidden-unfold-html-example#edit">Show some text only after something has been clicked ("spoiler" / "unfold content")</a></li>
    <li><a href="https://perchance.org/comments-plugin-goto-plugin-example#edit">Combine the goto plugin with the comments plugin to create "rooms" that have their own comments box</a></li>
    <li><a href="https://perchance.org/pure-css-html-plugin-template#edit">A template for a plugin that just returns some CSS and HTML</a></li>
    <li><a href="https://perchance.org/select-item-from-same-index-position-in-two-lists#edit">Select item from same index/position in two lists</a></li>
    <li><a href="https://perchance.org/adjustable-vertical-split-example#edit">Resizable vertical split screen</a></li>
	</ul>

</main>
<p style="text-align:center; font-size:200%; opacity:0.2; margin-top:0.5em;"><span>⚄&#xFE0E;</span></p>
<br/>

<style>
	ul li {
		margin-top:0.5em;
	}
	main {
		max-width:800px;
		margin:0 auto;
		background: #fff;
		background: light-dark(#fff, #101010);
		padding:1em;
		border-radius:3px;
		box-shadow: 0 0.5px 0 0 #ffffff inset, 0 1px 2px 0 #B3B3B3;
		box-shadow: 0 0.5px 0 0 light-dark(#fff, #060606) inset, 0 1px 2px 0 light-dark(#B3B3B3, #2c2c2c);
	}
	p { text-align:left; line-height: 1.4em; }
  main p:first-child {
    margin-top:0;
  }
	body {
		background-color:#f6f6f6;
		background-color: light-dark(#f6f6f6, #000);
    color: black;
    color: light-dark(black, #d6d6d6);
	}
	pre {
		text-align:left;
		background: #333;
    background: light-dark(#333, #212121);
    color: #e2e2e2;
    padding: 1em;
    border-radius: 2px;
		tab-size: 2;
		-moz-tab-size: 2;
		-o-tab-size: 2;
		-webkit-tab-size: 2;
	}
	code {
		background: #eff0f1;
    background:  light-dark(#eff0f1, #272727);
    padding: 1px 5px;
		white-space: nowrap;
	}
  details {
    background:#efefef;
    background:light-dark(#efefef, #212121);
  }
	details code {
	  background: #d9d9d9;
	  background: light-dark(#d9d9d9, #5a5a5a);
	}
	details p:last-child {
	  margin-bottom:0;
	}
	h2 {
		margin-top: 1.5em;
	}
</style>





<style>
	#contentsCtn {
	  position:fixed;
		top: 50%;
		transform: translate(0.5rem, -50%);
		background:white;
    background: light-dark(white, #222);
		text-align:left;
		padding:1rem;
		border-radius:3px;
		box-shadow: 0 0.5px 0 0 #ffffff inset, 0 1px 2px 0 #B3B3B3;
		box-shadow: 0 0.5px 0 0 light-dark(#ffffff, #000000) inset, 0 1px 2px 0 light-dark(#B3B3B3, #000000);
	}
	.contents-item {
		cursor: pointer;
		padding:0.25rem;
    font-size: 0.85rem;
	}
	.contents-item:hover {
	  background:#efefef;
	  background:light-dark(#efefef, #444);
	}
	@media screen and (max-width: 1200px) {
		#contentsCtn {
			display:none;
		}
	}
  html { color-scheme: light dark; }
</style>
<div id="contentsCtn">
  <div style="font-weight:bold; padding:0.25rem;">Contents</div>
</div>
<script>
  let maxtContentsItemTitleLength = 20;
  if(window.innerWidth > 1300) maxtContentsItemTitleLength = 40;

  let headerEls = [...document.querySelectorAll("h2")]
	let contentsItems = [];
	for(let el of headerEls) {
	  let item = createContentsItem(el);
		contentsItems.push(item);
		contentsCtn.appendChild(item);
	}

	function createContentsItem(el) {
	  let div = document.createElement("div");
		div.innerHTML = `
		  <div class="contents-item" data-title="${el.textContent.replace(/"/g, "&quot;")}">${el.textContent.length > maxtContentsItemTitleLength ? el.textContent.slice(0, maxtContentsItemTitleLength-1)+"…" : el.textContent}</div>
		`;
		let item = div.firstElementChild;
		item.onclick = function() {
		  el.scrollIntoView();
      window.scrollBy(0, -20);
      window.location.hash = el.id ? "#"+el.id : "";
		};
		return item;
	}
	let contentsTitleHighlighterDebounceTimeout = null;
	window.addEventListener("scroll", function() {
		clearTimeout(contentsTitleHighlighterDebounceTimeout);
		contentsTitleHighlighterDebounceTimeout = setTimeout(() => {
			let h2s = Array.from(document.querySelectorAll("h2"));
			let closestEl = null;
			let closestDist = null;
			for(let h2 of h2s) {
				let rect = h2.getBoundingClientRect();
				if(rect.top > window.innerHeight/2) continue;
				if(closestEl === null || Math.abs(rect.top) < closestDist) {
					closestDist = Math.abs(rect.top);
					closestEl = h2;
				}
			}
			contentsCtn.querySelectorAll(`.contents-item`).forEach(el => el.style.background = "");
			if(closestEl) {
        let closestTitle = closestEl.textContent;
  			contentsCtn.querySelector(`.contents-item[data-title="${closestTitle.replace(/"/g, '\\"')}"]`).style.background = CSS.supports("color", "light-dark(#fff,#000)") ? "light-dark(#efefef,#444)" : "#efefef";
      }
		}, 200);
	});
</script>
```

---

```perchance
$output(inputData, extraOpts) =>

  const serverOrigin = "https://text-generation.perchance.org";

  let iframe;
  if(!window.__alreadyAddedAiTextPluginStuff8492739) {
    iframe = document.createElement("iframe");
    iframe.src = `${serverOrigin}/embed`;
    iframe.style.cssText = "display:none; position:fixed; top:0.5rem; right:0.5rem; height:3rem; width:11rem; background:#333; border:none; border-radius:3px; box-shadow:0px 2px 4px 0px #00000066; z-index:10000";
    iframe.id = "aiTextPluginEmbedIframe";

    setTimeout(() => {
      if(!window.__aiTextIframeEmbedIsReady) {
        iframe.src = `${serverOrigin}/embed?__cacheBust=${Math.random()}`;
      }
    }, 15*1000);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes ai-text-plugin-blink { 50% { fill: transparent }} .ai-text-plugin-dot { animation: 1s ai-text-plugin-blink infinite; fill: grey; } .ai-text-plugin-dot:nth-child(2) { animation-delay: 250ms } .ai-text-plugin-dot:nth-child(3) { animation-delay: 500ms } .ai-text-plugin-loader { background-color: #f1f1f1; color: grey; }

      .ai-text-response-end-buttons-ctn:before {
        content: "+";
      }
      .ai-text-response-end-buttons-ctn {
        position:relative;
      }
      .ai-text-response-buttons-wrapper {
        display:none;
        position:absolute;
        width: max-content;
        bottom: 0;
        min-height: 2.5rem;
        pointer-events:none;
      }
      @media screen and (max-width: 600px) {
        .ai-text-response-buttons-wrapper {
          min-height: 3.5rem; /* buttons should be further apart on mobile - else 'hover' click triggers the buttons themselves */
        }
      }

      .ai-text-response-end-buttons-ctn:hover .ai-text-response-buttons-wrapper {
        display:flex;
        pointer-events:auto;
      }
    `;
    document.head.appendChild(style);

    window.addEventListener('message', (event) => {
      if(event.source !== iframe.contentWindow) return;
      if(event.origin !== serverOrigin) return;

      if(event.data.type === "embedIsReady") {
        window.__aiTextIframeEmbedIsReady = true;
        // console.debug("got embedIsReady, sent verifyUser");
        if(!window.__alreadyTriggeredAiTextPluginPreload8492739) {
          iframe.contentWindow.postMessage({type:"verifyUser"}, serverOrigin);
        }
      }
      if(event.data.type === "verified") {
        iframe.style.display = "none";
      }
      if(event.data.type === "verifying") {
        iframe.style.display = "";
      }
    });
    document.body.appendChild(iframe);

    window.__alreadyAddedAiTextPluginStuff8492739 = true;
  } else {
    iframe = document.querySelector("#aiTextPluginEmbedIframe");
  }

  if(inputData && inputData.preload === true) {
    if(!window.__alreadyTriggeredAiTextPluginPreload8492739) {
      (async function() {
        while(!window.__aiTextIframeEmbedIsReady) await new Promise(r => setTimeout(r, 500));
        await new Promise(r => setTimeout(r, 500));
        iframe.contentWindow.postMessage({type:"preload"}, serverOrigin);
      })();
      window.__alreadyTriggeredAiTextPluginPreload8492739 = true;
    }
    return "";
  }

  if(inputData && inputData.getMetaObject===true) {

    // Fast bigram-based approx token counter thingy.
    // About 80x faster and 200x smaller than HF tokenizer.
    // To "train" a new fast/approx counter like this (but e.g. on a non-deepseek tokenizer), use this script:
    //    deno run --allow-write=. --allow-net https://user.uploads.dev/file/e29eab687b1fbf129076ec6057484bb3.js --tokenizer=/abs/path/to/tokenizer.json
    const MODEL_BASE64="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",MAGIC=[68,66,71,49],VERSION=1,EMPTY_KEY=4294967295;function decodeVarUint(A,B){let Q=0,E=0;for(;;){const g=A[B.value++];if(E|=(127&g)<<Q,0==(128&g))return E>>>0;Q+=7}}function nextPow2(A){let B=1;for(;B<A;)B<<=1;return B}function keyHash(A){let B=A>>>0;return B^=B>>>16,B=Math.imul(B,2146121005),B^=B>>>15,B=Math.imul(B,2221713035),B^=B>>>16,B>>>0}function base64ToBytes(A){const B=atob(A),Q=new Uint8Array(B.length);for(let A=0;A<B.length;A+=1)Q[A]=B.charCodeAt(A);return Q}function parseModelBytes(A){const B=new DataView(A.buffer,A.byteOffset,A.byteLength);let Q=0;for(const A of MAGIC)if(B.getUint8(Q++)!==A)throw new Error("Invalid model header.");const E=B.getUint16(Q,!0);if(Q+=2,Q+=2,1!==E)throw new Error(`Unsupported model version: ${E}`);const g=B.getFloat32(Q,!0);Q+=4;const w=B.getFloat32(Q,!0);Q+=4;const C=B.getFloat32(Q,!0);Q+=4;const D=B.getUint32(Q,!0);Q+=4;const I=B.getUint32(Q,!0);Q+=4;const M=new Int16Array(A.buffer,A.byteOffset+Q,256);Q+=M.byteLength;const P=A.subarray(Q,Q+I);Q+=I;const f=new Int16Array(A.buffer,A.byteOffset+Q,D),e=new Uint32Array(D);let v=0;const H={value:0};for(let A=0;A<D;A+=1)v+=decodeVarUint(P,H),e[A]=v>>>0;const c=nextPow2(Math.max(8,2*D)),o=new Uint32Array(c),t=new Int16Array(c);o.fill(EMPTY_KEY);for(let A=0;A<D;A+=1){const B=e[A];let Q=keyHash(B)&c-1;for(;o[Q]!==EMPTY_KEY;)Q=Q+1&c-1;o[Q]=B,t[Q]=f[A]}return{bias:g,unigramScale:w,bigramScale:C,unigramWeights:M,tableKeys:o,tableWeights:t}}const model=parseModelBytes(base64ToBytes(MODEL_BASE64)),encoder=new TextEncoder,mask=model.tableKeys.length-1;function lookupPairWeight(A){let B=keyHash(A)&mask;for(;;){const Q=model.tableKeys[B];if(Q===EMPTY_KEY)return 0;if(Q===A)return model.tableWeights[B]/model.bigramScale;B=B+1&mask}}
    function countTokensApprox(A){const B=encoder.encode(A);let Q=model.bias,E=256;for(let A=0;A<B.length;A+=1){const g=B[A];Q+=model.unigramWeights[g]/model.unigramScale,Q+=lookupPairWeight(257*E+g),E=g}return Q+=lookupPairWeight(257*E+256),Q};

    return {
      countTokens: function(text) {
        return Math.ceil(countTokensApprox(text));
        // return Math.ceil(text.length/3.6); // old, very bad approximation
      },
      idealMaxContextTokens: 6000, // this is just a recommendation - not a fundamental limit. and it will increase over time.
    };
  }
  // console.debug("inputData:", inputData);
  if(!inputData) return "(Error: No input data given to the ai text plugin.)";
  if(inputData.instructions) {
    if(inputData.outputTo) {
      inputData.outputTo.value = "(Error: Looks like you wrote 'instructions = ...' instead of 'instruction = ...' in your ai-text-plugin prompt data?)";
    } else {
      return "(Error: Looks like you wrote 'instructions = ...' instead of 'instruction = ...' in your ai-text-plugin prompt data?)";
    }
  }

  if(typeof inputData === "string" || inputData instanceof String) {
    inputData = {instruction:inputData+""}
    if(!extraOpts) extraOpts = {};
    if(extraOpts.startWith) inputData.startWith = extraOpts.startWith;
    if(extraOpts.stopSequences) inputData.stopSequences = extraOpts.stopSequences;
    if(extraOpts.hideStartWith) inputData.hideStartWith = extraOpts.hideStartWith;
    if(extraOpts.outputTo) inputData.outputTo = extraOpts.outputTo;
    if(extraOpts.outputTo) inputData.outputTo = extraOpts.outputTo;
    if(extraOpts.onChunk) inputData.onChunk = extraOpts.onChunk;
    if(extraOpts.onStart) inputData.onStart = extraOpts.onStart;
    if(extraOpts.onFinish) inputData.onFinish = extraOpts.onFinish;
    if(extraOpts.render) inputData.render = extraOpts.render;
    if(extraOpts.endButtons) inputData.endButtons = extraOpts.endButtons;
  }

  // REMEMBER: if you add more inputs, you need to also update `window.__continueAiTextResponseClickHandler`
  let hideStartWith = inputData.hideStartWith; // get the 'concrete' value in case it was dynamic like `hideStartWith = [ ... ]` - this is important because the condition in the square brackets could change later

  let instruction = inputData.instruction;
  if(typeof instruction === "function") {
    instruction = instruction({}); // this is useful as a way to give a string that should not be evaluated - since e.g. instruction = [textareaEl.value] will actually evaluate the text when we call inputData.instruction
    if(typeof instruction !== "string") instruction = instruction.toString();
  } else if(instruction) {
    if(typeof instruction !== "string") {
      instruction = instruction.evaluateItem;
    }
    instruction = instruction.toString();
  } else {
    instruction = "Write something."; // default instruction
  }

  let startWith = inputData.startWith;
  if(typeof startWith === "function") {
    startWith = startWith({}); // this is useful as a way to give a string that should not be evaluated - since e.g. startWith = [textareaEl.value] will actually evaluate the text when we call inputData.startWith
    if(typeof startWith !== "string") startWith = startWith.toString();
  } else if(startWith) {
    if(typeof startWith !== "string") {
      startWith = startWith.evaluateItem;
    }
    startWith = startWith.toString();
    // We trim whitespace off the end due to the classic tokenizer problem (most word tokens start with a space as of 2023 tokenizers).
    // This of course does mean that you can't "force" the model to start with a space after a word, but it's worth that trade-off until we get models with better tokenizers.
    startWith = startWith.replace(/ +$/g, ""); // CAUTION: Don't trim newlines - only spaces. Because e.g. the story writer demo relies on being able to start with 2 new lines before the paragraph that the AI is about to generate, since if the AI generates them, it'll trigger the stop sequence before it even gets to start writing the new paragraph
  } else {
    startWith = "";
  }

  let stopSequences = inputData.stopSequences;
  if(typeof stopSequences === "function") {
    stopSequences = stopSequences({});
  } else if(stopSequences) {
    if(!Array.isArray(stopSequences)) {
      stopSequences = stopSequences.selectAll.map(n => n.evaluateItem);
    }
  } else {
    stopSequences = [];
  }

  let textareaLoadingIndicatorHandler;

  // REMEMBER: if you add more inputs, you need to also update `window.__continueAiTextResponseClickHandler`

  let concreteInputs = {startWith, instruction, stopSequences};  // <-- CAUTION: the startWith property of this is set to the full startWith+generatedText after generation, and the startWith can be changed after generation for the `editAiTextResponseClickHandler` feature - ctrl+f for `concreteInputs.startWith =`. Use `originalConcreteInputs` for original inputs.
  const originalConcreteInputs = Object.freeze(JSON.parse(JSON.stringify(concreteInputs)));

  let placeholderEl;
  let placeholderElDidInitiallyExist = false; // this is for keepalive stuff - so we can cancel a queued up generation if the placeholder is removed
  let userStoppedGeneration = false;

  let textStreamController;
  const textStream = new ReadableStream({
    start(c) {
      textStreamController = c;
    }
  });

  let darkModeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const animatedLoadingSvg = `<svg style="${darkModeEnabled ? "filter:invert(0.85);" : ""} height:1rem; width:2rem; overflow:hidden; border-radius:3px; vertical-align:top; position:relative; top:0.07rem; margin-left:0.125rem;" height="1rem" width="2rem" class="ai-text-plugin-loader"> <circle class="ai-text-plugin-dot" cx="0.5em" cy="0.5em" r="0.2em" style="fill:grey;"></circle> <circle class="ai-text-plugin-dot" cx="1em" cy="0.5em" r="0.2em" style="fill:grey;"></circle> <circle class="ai-text-plugin-dot" cx="1.5em" cy="0.5em" r="0.2em" style="fill:grey;"></circle> </svg>`;

  let generatedText = "";
  let finishedGenerating = false;
  let thereWasAnErrorDuringGeneration = false;

  let onFinishPromiseResolver;
  let onFinishPromiseRejecter;
  let onFinishPromise = new Promise((resolve, reject) => {
    onFinishPromiseResolver = resolve;
    onFinishPromiseRejecter = reject;
  });

  let completionId = "aiTextCompletion"+Math.random().toString().replace(".", "");
  let lastGeneratedChunkReceivedTime = null;

  async function streamTextFromIframe(chunkCallback) {
    let postData = {};
    postData.instruction = concreteInputs.instruction || "";
    postData.startWith = concreteInputs.startWith || "";
    postData.stopSequences = concreteInputs.stopSequences || [];
    postData.generatorName = window.generatorName;

    postData.instruction = postData.instruction.replace(" ", " ");
    if(!postData.instruction.includes(" ")) { postData.instruction = `${postData.instruction} `; }

    let url = `${serverOrigin}/api/generate`;
    let haveReceivedFirstTextChunk = false;
    let haveReceivedLastTextChunk = false;
    function messageHandler(event) {
      if(event.data.requestId !== completionId) return;

      // console.debug("streamTextFromIframe messageHandler:", event.data);
      if(event.data.type === "streamData") {
        lastGeneratedChunkReceivedTime = Date.now();
        let text = event.data.value.text;
        let data = {text};
        if(event.data.value.stopReason) data.stopReason = event.data.value.stopReason;

        // console.debug("event.data.value:", event.data.value);
        if(!haveReceivedFirstTextChunk) {
          data.isFirstChunk = true;
          haveReceivedFirstTextChunk = true;
        }
        if(haveReceivedLastTextChunk) {
          console.error("haveReceivedLastTextChunk but about to send another chunk??? maybe recieving streamEnd before it's actually finished??");
        }
        if(event.data.value.final) {
          data.isLastChunk = true; // remember, a chunk can be both the first *and* last chunk
          haveReceivedLastTextChunk = true;
        }
        chunkCallback(data);
      } else if (event.data.type === "streamEnd") {
        // console.debug(`ai-text-plugin Received 'streamEnd' for ${completionId}`);
        window.removeEventListener("message", messageHandler);
        if(!haveReceivedLastTextChunk) {
          // this can happen if stream is aborted, or if .stop() was called in userland, and perhaps for other reasons, so we send a last "dummy" chunk
          chunkCallback({text:"", stopReason:"user", isLastChunk:true, isFirstChunk:!haveReceivedFirstTextChunk});
          haveReceivedLastTextChunk = true;
        }
      } else if (event.data.type === "streamError") {
        if(userStoppedGeneration && event.data.status === "stale") {
          // this is not actually an error, but iframe embed can't know that, so it sends us this, which we just ignore.
        } else {
          if(!finishedGenerating) { // <-- just to guard against weird timing stuff
            thereWasAnErrorDuringGeneration = true;
            chunkCallback({text:"", error:true, isLastChunk:!haveReceivedLastTextChunk, isFirstChunk:!haveReceivedFirstTextChunk});
            let div = document.createElement("div");
            div.innerHTML = `<div style="z-index:1000; position: fixed; bottom: 1rem; width: 100%; pointer-events:none;"><span style=" padding: 0.5rem; background: #ac2c2c; border-radius: 3px; color: white; pointer-events:auto;">error: ${event.data.status.replaceAll("_", " ")}</span></div>`;
            div = div.firstElementChild;
            document.body.appendChild(div);
            setTimeout(() => {
              div.remove();
            }, 1000*5);
          }
        }
        window.removeEventListener("message", messageHandler);
      }
    }

    window.addEventListener("message", messageHandler);

    while(!window.__aiTextIframeEmbedIsReady) {
      await new Promise(r => setTimeout(r, 100));
    }
    if(inputData._debug) postData._debug = JSON.parse(JSON.stringify(inputData._debug));
    iframe.contentWindow.postMessage({ type: "startStream", url, postData, requestId:completionId, perchanceGeneratorOrigin:window.location.origin }, serverOrigin);
    // console.debug("sent startStream request to iframe");
  }

  async function editAiTextResponseClickHandler(el) {
    let saveButton = document.createElement("button");
    saveButton.style.cssText = "position:fixed; z-index:501;";
    saveButton.textContent = "💾";
    document.body.append(saveButton);

    let textarea = document.createElement("textarea");
    textarea.style.cssText = "z-index:500; display:block; position:fixed; min-height:2rem; min-width:10rem;";
    textarea.value = concreteInputs.startWith;
    document.body.append(textarea);
    let updateCoverPosition = () => {
      let rect = el.getBoundingClientRect();
      textarea.style.left = `${rect.left}px`;
      textarea.style.top = `${rect.top}px`;
      textarea.style.width = `${rect.width}px`;
      textarea.style.height = `${rect.height+10}px`;

      let textareaRect = textarea.getBoundingClientRect(); // Use coverElement's dimensions
      saveButton.style.left = `${textareaRect.right-saveButton.offsetWidth}px`;
      saveButton.style.top = `${textareaRect.bottom}px`;
    };
    updateCoverPosition();
    window.addEventListener('scroll', updateCoverPosition);
    window.addEventListener('resize', updateCoverPosition);

    const observer = new MutationObserver((mutationsList) => {
      for(let mutation of mutationsList) {
        for(let node of mutation.removedNodes) {
          if(node.contains(el)) {
            textarea.remove();
            saveButton.remove();
            window.removeEventListener('scroll', updateCoverPosition);
            window.removeEventListener('resize', updateCoverPosition);
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    await new Promise(r => saveButton.onclick=r);

    let endButtonsCtn = el.querySelector(".ai-text-response-end-buttons-ctn");
    endButtonsCtn.remove();

    concreteInputs.startWith = textarea.value;

    // we do this because the onFinishPromise is actually the return value of this function, but it also serves as an object with a bunch of handy properties like .liveResponseText, .stop(), etc.
    onFinishPromise.liveResponseText = textarea.value;

    // el.innerHTML = textarea.value;
    // el.appendChild(endButtonsCtn);
    renderResponseTextIntoContainer(textarea.value, {addEndButtons:true, isFinalRender:true});

    window.removeEventListener('scroll', updateCoverPosition);
    window.removeEventListener('resize', updateCoverPosition);
    textarea.remove();
    saveButton.remove();
  };

  async function continueAiTextResponseClickHandler(el, opts={}) {
    let instruction = concreteInputs.instruction;
    let startWith = concreteInputs.startWith;
    let stopSequences = concreteInputs.stopSequences;

    if(opts.appendContinuationSuffix) startWith += "\n";

    responseEndButtonsCtn.remove();
    let obj = $output({instruction, startWith, stopSequences, style:inputData.style, outputTo:el, render:inputData.render, onFinish:inputData.onFinish, onChunk:inputData.onChunk});
    el.innerHTML += obj.loadingIndicatorHtml;
    let result = await obj;
    if(!opts.appendContinuationSuffix && result.generatedText === "" && !result.text.endsWith("\n\n")) {
      // no text was generated, so try again with a suffix that's likely to trigger more text.
      // TODO: maybe check stopReason here too?
      continueAiTextResponseClickHandler(el, {appendContinuationSuffix:true})
    }
  };

  let responseEndButtonsCtn;
  {
    let buttonGap = "0.25rem";
    if(window.innerWidth < 600) buttonGap = "1.5rem";

    let darkModeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let responseEndButtonsHtml = `<span class="ai-text-response-end-buttons-ctn" style="display: inline-flex;background:${darkModeEnabled ? "#666666" : "#f1f1f1"};color: ${darkModeEnabled ? "#d5d5d5" : "grey"};height: 1rem;width: 1rem;border-radius: 3px;vertical-align: top;position: relative;top: 0.07rem;margin-left: 0.125rem;align-items: center;justify-content: center;cursor: pointer; font-size:80%">
      <div class="ai-text-response-buttons-wrapper">
        <button class="ai-text-continue-button" style="height:min-content;">▶️</button>
        <button class="ai-text-edit-button" style="height:min-content; margin-left:${buttonGap}">✏️</button>
      </div>
    </span>`;
    responseEndButtonsCtn = document.createElement("div");
    responseEndButtonsCtn.innerHTML = responseEndButtonsHtml;
    responseEndButtonsCtn = responseEndButtonsCtn.firstElementChild;
    if(inputData.endButtons?.evaluateItem === "none") {
      responseEndButtonsCtn.style.display = "none";
    }
    responseEndButtonsCtn.querySelector(".ai-text-continue-button").onclick = function() {
      // console.debug("wrapper display:", this.closest('.ai-text-response-buttons-wrapper').style.display);
      let responseCtn = this.closest(".ai-text-response-end-buttons-ctn").__aiTextResponseCtn || this.closest('.ai-text-response-ctn');
      continueAiTextResponseClickHandler(responseCtn);
    };
    responseEndButtonsCtn.querySelector(".ai-text-edit-button").onclick = function() {
      // console.debug("wrapper display:", this.closest('.ai-text-response-buttons-wrapper').style.display);
      let responseCtn = this.closest(".ai-text-response-end-buttons-ctn").__aiTextResponseCtn || this.closest('.ai-text-response-ctn');
      editAiTextResponseClickHandler(responseCtn);
    };
  }

  function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  let startWithRegex;

  function renderResponseTextIntoContainer(response, opts={}) {
    if(!inputData.outputTo && !placeholderEl) return; // <-- indicates that they're doing things manually with e.g. onFinishPromise/onChunk/etc.

    if(hideStartWith) { // note that `hideStartWith` is purely 'visual' - it's just a handy helper for a common case (that could otherwise be solved with `render`)
      if(!startWithRegex) startWithRegex = new RegExp("^"+escapeRegExp(concreteInputs.startWith));
      response = response.replace(startWithRegex, "");
    }
    if(inputData.render) {
      response = inputData.render({text:response, isPartial:!opts.isFinalRender});
    }
    if(inputData.outputTo) {
      if(typeof inputData.outputTo.value == "string") { // textarea, input, or user's custom object with string `.value` property
        inputData.outputTo.value = response;
        if(inputData.outputTo.tagName === "TEXTAREA") {
          if(inputData.outputTo.scrollTop > (inputData.outputTo.scrollHeight - inputData.outputTo.offsetHeight)-30) { // <-- if the text box is already scrolled near the end of the text
            inputData.outputTo.scrollTop = 9999999999; // scroll down to bottom of text box
          }
        }
      } else {
        inputData.outputTo.innerHTML = response;
        if(opts.addEndButtons) {
          responseEndButtonsCtn.title = `Inputs that were used:\n\ninstruction=${concreteInputs.instruction}\n\nstartWith=${concreteInputs.startWith}`;
          responseEndButtonsCtn.__aiTextResponseCtn = inputData.outputTo;
          inputData.outputTo.append(responseEndButtonsCtn);
        }
      }
    } else {
      if(typeof placeholderEl.value == "string") { // textarea, input, or user's custom object with string `.value` property
        placeholderEl.value = response;
      } else {
        placeholderEl.innerHTML = response;
        if(opts.addEndButtons) {
          responseEndButtonsCtn.title = `Inputs that were used:\n\ninstruction=${concreteInputs.instruction}\n\nstartWith=${concreteInputs.startWith}`;
          placeholderEl.append(responseEndButtonsCtn);
        }
      }
    }
  }

  let gotFirstChunk = false;
  let chunks = [];
  let generatedChunks = []; // difference from `chunks` is that this doesn't include the user-specified `startWith` text
  let alreadyDoneOnFinishStuff = false; // just as an extra guard against bugs

  function doOnFinishStuff({stopReason}) {
    if(alreadyDoneOnFinishStuff) return; // this is possible because e.g. userland onChunk can synchronously call .stop(), so it gets executed after last chunk arrival via stopFn(), but before 'normal' doOnFinishStuff call
    alreadyDoneOnFinishStuff = true;

    console.debug("FINISHED STREAMING.");

    let finishData = new String(chunks.join(""));
    finishData.text = chunks.join("");
    finishData.generatedText = generatedChunks.join("");
    finishData.stopReason = stopReason;

    if(inputData.onFinish) {
      try { inputData.onFinish(finishData); } catch(e) { console.error("error in onFinish:", e); }
    }
    onFinishPromiseResolver(finishData);
    generatedText = generatedChunks.join("");

    if(textareaLoadingIndicatorHandler) textareaLoadingIndicatorHandler.stop();
    try { textStreamController.close(); } catch(e) { console.error(e); }
  }
  function stopFn() {
    if(finishedGenerating) return;
    finishedGenerating = true;

    if(!gotFirstChunk && placeholderEl) placeholderEl.innerHTML = ""; // clear the svg 'loading' dots

    doOnFinishStuff({stopReason:"user"});
  }

  async function startStreamingResponse() {
    try {
      (async function() {
        await new Promise(r => setTimeout(r, 500));
        while(true) {
          if(userStoppedGeneration) {
            console.debug("stopping keepalives due to `userStoppedGeneration`");
            break;
          }
          if(finishedGenerating) { console.debug("stopping keepalives due to `finishedGenerating`"); break; }
          if(placeholderElDidInitiallyExist && !document.querySelector(`#${completionId}`)) { console.debug("stopping keepalives due to `placeholderEl`"); break; } // placeholderEl no longer exists in the DOM, so user probably clicked 'randomize' or whatever while previous one was still loading, hence we abort previous one by stopping the keepalives, which drops it from the queue
          if(inputData.outputTo && (!document.body.contains(inputData.outputTo) || inputData.outputTo.dataset.aiTextCompletionId !== completionId))  { console.debug("stopping keepalives due to `outputTo`"); break; }
          // if(lastGeneratedChunkReceivedTime !== null && Date.now()-lastGeneratedChunkReceivedTime > 1000*20)  { console.debug("stopping keepalives due to generation having started but no new chunks Received in 20 seconds"); break; }

          iframe.contentWindow.postMessage({ type: "streamKeepAlive", requestId:completionId }, serverOrigin);
          console.debug("streamKeepAlive sent");
          await new Promise(r => setTimeout(r, 800));
          // if(window.devTest98375290385) await new Promise(r => setTimeout(r, 10000000000));
        }
        try { stopFn(); } catch(e) { console.error(e); }; // need to call stopFn() here (and not just wait for it to be called in streamTextFromIframe) because otherwise it only gets called if streamTextFromIframe gets called again, which it *might not*
        try { iframe.contentWindow.postMessage({ type: "stopStream", requestId:completionId }, serverOrigin); } catch(e) { console.error(e); };
      })();

      streamTextFromIframe(function(data) {
        if(userStoppedGeneration) {
          if(!finishedGenerating) stopFn();
          return;
        }
        if(placeholderElDidInitiallyExist && !document.querySelector(`#${completionId}`)) {
          if(!finishedGenerating) stopFn();
          return;
        }
        if(inputData.outputTo && (!document.body.contains(inputData.outputTo) || inputData.outputTo.dataset.aiTextCompletionId !== completionId)) {
          if(!finishedGenerating) stopFn();
          return;
        }
        if(finishedGenerating) {
          thereWasAnErrorDuringGeneration = true;
          console.error("We received a chunk of text even though we've already finishedGenerating?");
          return;
        }

        // add the startWith chunk before the first 'real' chunk:
        if(data.isFirstChunk && concreteInputs.startWith && !hideStartWith) {
          chunks.push(concreteInputs.startWith);
          textStreamController.enqueue(concreteInputs.startWith);
          if(inputData.onChunk) {
            inputData.onChunk({fullTextSoFar:chunks.join(""), textChunk:concreteInputs.startWith, isFromStartWith:true});
          }
        }

        if(data.error) {
          let allChunksJoined = chunks.join("");
          thereWasAnErrorDuringGeneration = true;
          finishedGenerating = true;

          concreteInputs.startWith = allChunksJoined;
          renderResponseTextIntoContainer(allChunksJoined, {addEndButtons:true, isFinalRender:true});

          doOnFinishStuff({stopReason:"error"});
        } else {
          generationLastKnownToBeWorkingAt = Date.now();
          if(data.isFirstChunk) {
            gotFirstChunk = true;
            if(placeholderEl) placeholderEl.innerHTML = ""; // clear the svg 'loading' dots
            if(inputData.beforeFirstChunk) {
              inputData.beforeFirstChunk({});
            }
          }

          generatedChunks.push(data.text);
          chunks.push(data.text);
          textStreamController.enqueue(data.text);

          if(inputData.onChunk) {
            try { // user-land handler may throw error
              inputData.onChunk({fullTextSoFar:chunks.join(""), textChunk:data.text}); // `data.text` is the full text so far (like in onFinish, render, etc.), and `data.chunk` is the most recent chunk (the one that triggered this call to onChunk)
            } catch(e) {
              console.error("Error in onChunk:", e);
            }
          }

          onFinishPromise.liveResponseText = chunks.join("");

          renderResponseTextIntoContainer(chunks.join(""), {addEndButtons:!!data.isLastChunk, isFinalRender:!!data.isLastChunk});
          if(data.isLastChunk) {
            concreteInputs.startWith = chunks.join(""); // update the startWith for 'continue' and 'edit' button use
            finishedGenerating = true;
            doOnFinishStuff({stopReason:data.stopReason});
          }
        }
      });

    } catch(e) {
      thereWasAnErrorDuringGeneration = true;
      finishedGenerating = true;
      // onFinishPromiseRejecter();
      doOnFinishStuff({stopReason:"error"});

      console.error(e);
      await new Promise(r => setTimeout(r, 1000));
      iframe.contentWindow.postMessage({type:"verifyUser"}, serverOrigin); // probably not necessary, but just in case (it'll only re-verify if it's actually needed anyway)
    }
  }

  function onVisible(element, callback) {
    new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.intersectionRatio > 0) {
          callback(element);
          observer.disconnect();
        }
      });
    }).observe(element);
    if(!callback) return new Promise(r => callback=r);
  }

  setTimeout(async () => {
    // give placeholderEl a chance to be put into the DOM
    placeholderEl = document.querySelector(`#${completionId}`); // this will be null if they're using outputTo or are just doing things fully manually onFinishPromise/onChunk/etc.
    if(placeholderEl) placeholderElDidInitiallyExist = true;
    // wait for placeholderEl to become visible:
    if(placeholderElDidInitiallyExist && !inputData.outputTo) {
      await onVisible(placeholderEl);
    }

    if(inputData.onStart) {
      inputData.onStart(onFinishPromise); // note that `onFinishPromise` has all the data attached, like `inputs`, `liveResponseText`, etc. - see below
      if(inputData.outputTo && inputData.outputTo.tagName === "TEXTAREA") {
        try { textareaLoadingIndicatorHandler = addTextareaLoadingIndicator(inputData.outputTo); } catch(e) { console.error(e); } // try/catch because new code
      }
    }
    startStreamingResponse();
  }, 100);

  let beforeLoaderHtml = "";
  if(!inputData.outputTo && !hideStartWith) {
    beforeLoaderHtml = inputData.render ? inputData.render({text:concreteInputs.startWith, isPartial:true}) : concreteInputs.startWith;
  }

  if(inputData.outputTo) {
    inputData.outputTo.dataset.aiTextCompletionId = completionId; // this is used for keepalive stuff - if a queued request is going to output to an outputTo element, but that element no longer has the correct `dataset.aiTextCompletionId` then we drop it from the queue
  }

  onFinishPromise.inputs = originalConcreteInputs;
  onFinishPromise.liveResponseText = concreteInputs.startWith; // this is full text (including startWith, which is why this property isn't called liveGeneratedText, or liveOutputText) and is live-updated as chunks come in. and note that it can also be edited by the user using the end buttons
  onFinishPromise.textStream = textStream;
  onFinishPromise.onFinishPromise = onFinishPromise; // backwards-compat with old return object
  onFinishPromise.stop = () => {
    userStoppedGeneration = true;
    try { stopFn(); } catch(e) { console.error(e); };
    try { iframe.contentWindow.postMessage({ type: "stopStream", requestId:completionId }, serverOrigin); } catch(e) { console.error(e); };
    return onFinishPromise; // <-- so .stop() returns the output data
  };
  onFinishPromise.id = completionId;
  onFinishPromise.loadingIndicatorHtml = animatedLoadingSvg; // <-- just a littler helper for people who are e.g. using onFinishPromise/onChunk/etc. but want to add a loading indicator to the page manually
  onFinishPromise.toString = function() { // this object stringifies into the default placeholder element
    return `<span class="ai-text-response-ctn" id="${completionId}" style="white-space:pre-wrap; ${inputData.style ? inputData.style : ""}">${beforeLoaderHtml}${animatedLoadingSvg}</span>`;
  };
  onFinishPromise.submitUserRating = async ({score, reason}) => {
    if(!finishedGenerating || thereWasAnErrorDuringGeneration) {
      console.error(thereWasAnErrorDuringGeneration ? "cannot rate because there was an error during generation" : "cannot rate because it hasn't finished generating yet");
      return;
    }
    if(isNaN(Number(score)) || Number(score) > 1 || Number(score) < 0) return alert(`User rating should be a value between 0 (bad) and 1 (good). Like 0.4 or 0.8, for example.`);
    score = Number(score);
    if(!reason) reason = "";
    iframe.contentWindow.postMessage({ type: "rateGeneratedText", instruction, startWith, generatedText, generatorName:window.generatorName, score, reason }, serverOrigin);
  };
  return onFinishPromise;





// this was causing user-agent styles (specifically background color) to be removed in dark mode in chrome for some reason.
// it's a little too obtrusive anyway - ideally it would just be a "sliding line" that's only at the bottom of the textarea.
// or maybe a transparent loading indicator in the top-right of the textarea.
addTextareaLoadingIndicator(el) =>
  // const computedStyle = getComputedStyle(el);
  // const borderColor = computedStyle.borderColor;
  // // Convert border color to rgba with 30% opacity
  // const rgbaColor = borderColor.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 'rgba($1, $2, $3, 0.3)');
  // const className = 'blink-' + Math.random().toString(36).substring(2, 15);
  // const style = document.createElement('style');
  // style.innerHTML = `
  //   @keyframes ${className}-blink {
  //     0%, 100% {
  //       border-color: ${borderColor};
  //     }
  //     50% {
  //       border-color: ${rgbaColor};
  //     }
  //   }
  //   .${className} {
  //     animation: ${className}-blink 1s infinite;
  //     border-color: ${borderColor}; /* must add this explicitly, since user-agent-only borders don't trigger the animation */
  //   }
  // `;
  // document.head.appendChild(style);
  // el.classList.add(className);
  return {
    stop: function() {
      // el.classList.remove(className);
      // document.head.removeChild(style);
    },
  };








character
  {mech|demon|cyberpunk} {warrior|minion|samurai}

place
  a retropunk distopia
  a small village
  a mountainous region
  an underwater cavern
  a = 10

season
  winter
  summer

poemPrompt
  instruction = Write a haiku about a [character] in [place] during [season].



```

```html
<div style="display:[window.generatorName === 'ai-text-plugin' ? 'none' : 'block'];color:red; font-weight:bold; padding:3rem;">
  Heads up! This is a fork/remix of the <a href="/ai-text-plugin" target="_blank">ai-text-plugin</a>, but unfortunately it's a really bad idea to fork this plugin, since its code is 'coupled' with the server code, so if I need to change the server code, your version of this plugin will likely break.
  If you'd like new features, best to ask for them on the community forum so your generators don't randomly break in the future when I update the server code. Alternatively, you can create a new plugin that <u>imports the official version of this plugin</u> - basically create a "wrapper" plugin that
  changes/expands on the plugin's behavior.
</div>

<h1>🖋️📜 AI Text Plugin 📖🤖</h1>

<main>
  <p>
    This plugin allows you generate text with AI. It doesn't run on your actual device like other Perchance plugins because it requires too much computational power (and would require a many-gigabyte download), so it runs on
    <a href="https://en.wikipedia.org/wiki/Server_(computing)" target="_blank">server</a> GPUs, which means it costs me money to run. For that reason, this plugin is funded with ads, so
    <b style="color:red;">an ad will appear on your generator <u>for non-logged-in users</u> if you import this plugin</b>. The ad will appear at the bottom of the screen
    <a href="https://user.uploads.dev/file/e3cdfc34728610cf6e351b72052ef0c1.jpeg" target="_blank" title="graphic design is my passion">like this</a>. The ad will go away if you remove the plugin, of course.
  </p>

  <p>To use this plugin, you'll first need to import it by adding this line to your lists editor:</p>
  <pre>
ai = \{import:ai-text-plugin\}
</pre
  >
  <p>And now try putting this in your lists editor:</p>
  <pre>
character
  \{mech|demon|cyberpunk\} \{warrior|minion|samurai\}

place
  a retropunk distopia
  a small village
  a mountainous region
  an underwater cavern

season
  winter
  summer
  
poemPrompt
  instruction = Write a haiku about a \[character\] in \[place\] during \[season\].
  
output
  \[ai(poemPrompt)\]
</pre
  >
  <p><a href="https://perchance.org/ai-text-plugin-poem-example-1#edit" target="_blank">Here's an example generator</a> to start you off, and here's a live version of the above code, running on this page:</p>
  <p id="outputEl1" style="text-align:center;">[$output(poemPrompt)]</p>
  <p style="text-align:center;"><button onclick="update(outputEl1)">randomize</button></p>

  <p>You can hover your mouse over the little icon that appears at the end of the text to see the instruction that was used to generate it.</p>
  <p>Here's an example where we give the AI an instruction, but we also ensure that the response starts with "It was the night before Christmas in":</p>
  <pre>
storyPrompt
  instruction = Write a \{spooky|silly\} story involving \{a\} \{import:object\}.
  startWith = It was the night before Christmas in
</pre
  >
  <p><a href="https://perchance.org/ai-character-design-example-simple#edit" target="_blank">Here's a simple example</a> that uses <code>startWith</code>.</p>

  <p>If you pass some text directly into this plugin, it'll be interpreted as the <code>instruction</code>:</p>
  <pre>
output
  \[ai("Explain quantum field theory to a toddler.")\]
</pre
  >
  <p>Check out some of these example generators to see different ways to use this plugin, and learn about some advanced features:</p>
  <ul>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-character-design-example#edit" target="_blank">Fantasy Character</a> - Description + image using <code>onFinish</code> and <a href="/text-to-image-plugin" target="_blank">text-to-image-plugin</a>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-text-plugin-tester#edit" target="_blank">Prompt Tester</a> - Easily test your prompts. Also demonstrates <code>outputTo</code> property.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-chat-example#edit" target="_blank">AI Chat</a> - Design and chat with an AI character. Uses <code>stopSequences</code> and <code>onFinish</code>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-text-plugin-render-example#edit" target="_blank">Render Example</a> - Displays 'actions' like *smiles smugly* into <i style="opacity:0.6;">smiles smugly</i> using <code>render</code>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/random-character-chat-example#edit" target="_blank">Two Character Chat</a> - Makes 2 random game characters chat with one another.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-short-story-generator-example#edit" target="_blank">Short Story</a> - Generates a short story with pictures. Uses <code>render</code> in an interesting way.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-story-outline-generator-example#edit" target="_blank">Story Outline</a> - Generates a story outline (plot, characters, etc.) with a cover image.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-text-plugin-text-to-speech-example#edit" target="_blank">Text-to-Speech</a> - Streams generated text into the <a href="/text-to-speech-plugin" target="_blank">text-to-speech-plugin</a>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-story-writing-helper-example#edit" target="_blank">Story Writing Helper</a> - Shows use of <code>onChunk</code> and <code>stop()</code>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-text-adventure-example#edit" target="_blank">Multi-Choice Text Adventure</a> - Story where each step has several actions to choose from.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-generated-hierarchical-world-example#edit" target="_blank">Hierarchical World Explorer</a> - Similar to the <a href="https://perchance.org/nested-plugin" target="_blank">nested-plugin</a>.</li>
    <li><a style="font-weight:bold;" href="https://perchance.org/ai-text-example-with-user-input#edit" target="_blank">User Input Example</a> - Take some user input as part of the writing instructions for the AI.</li>
  </ul>

  <p>
    You can make <code>instruction</code> and/or <code>startWith</code> into a list, and then add <code style="white-space:pre;">$output = \[this.joinItems("\\n")\]</code> to the top of the list to join all the lines together like in
    <a href="https://perchance.org/ai-text-plugin-multi-line-example#edit" target="_blank">this example</a>:
  </p>
  <pre>
catGymPrompt
  startWith
    cat: i umm... *muffled heavy breathing* i am a cat, and i'm calling to ask about your tuesday pilates classes
    kind staff member: sure! i can help you with that, can-
    cat:
    $output = \[this.joinItems("\\n")\] <span style="opacity:0.5">// &lt;-- this joins all the above lines together instead of selecting a random one</span>
</pre>
  <p style="font-size:80%;">
    <b>Note:</b> You might be accustomed to using <code>this.joinItems("&lt;br&gt;")</code>, but in this case <code>\\n</code> (which means <b>n</b>ewline) is probably better since the AI is trained primarily on text, rather than HTML (but it definitely can generate HTML if you need that!). I've
    made it so <code>\\n</code> does actually create a line break in the visual display of the AI's outputs (most HTML element types don't do this <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/white-space" target="_blank">by default</a>).
  </p>

  <p><a href="https://perchance.org/mario-ai-therapist#edit" target="_blank">Here's</a> how to add a <code>style</code> option to adjust the visual display of the output text:</p>
  <pre>
marioAffirmationsPrompt
  instruction = Be Mario, and give me 3 positive affirmations with Mario's accent.
  style = text-align:left; color:blue; font-weight:bold; border:2px solid red; display:block; max-width:600px; margin:0 auto; padding:0.5rem; 
</pre
  >

  <p><b>Prompt Options:</b></p>
  <p>You can see a bunch of the options below at play in the example generators listed above, and in <a href="https://perchance.org/ai-text-plugin-demo" target="_blank">this sandbox demo</a> made by <a href="https://lemmy.world/u/wthit56" target="_blank">wthit56</a>.</p>
  <ul>
    <li><code style="font-weight:bold;">instruction</code> - Your instruction to the AI on what to write.</li>
    <li><code style="font-weight:bold;">startWith</code> - The text that you want the AI's writing to start with.</li>
    <li><code style="font-weight:bold;">stopSequences</code> - The AI will stop writing "naturally" when it thinks it's finished, but you can use <code>stopSequences</code> to provide a list of words/phrases that should make the AI stop if it writes them.</li>
    <li>
      <code style="font-weight:bold;">hideStartWith</code> - set this equal to <code>true</code> if you don't want the <code>startWith</code> text that you specified to actually get displayed. I.e. only the text <i>after</i> that will get displayed. You could also use a custom
      <code>render(data)</code> function (explained below) to achieve this.
    </li>
    <li>
      <code style="font-weight:bold;">outputTo</code> - Use this to tell the plugin to output the AI's response into a specific element, based on that element's ID. If you had an element with <code>id="myCoolElement"</code> in the HTML editor, then you'd write
      <code>outputTo = \[myCoolElement\]</code> to get the AI to output to that element. By default the AI's text will be put wherever you write <code>\[ai(...)\]</code>.
    </li>
    <li>
      <code style="font-weight:bold;">onChunk(data)</code> - the code you put in this will run after every chunk (which is usually a word, or part of a word). See <a href="https://perchance.org/ai-story-writing-helper-example#edit" target="_blank">this</a> generator for an example that uses it. You
      can access <code>data.textChunk</code> and <code>data.fullTextSoFar</code> and <code>data.isFromStartWith</code> (since the <code>startWith</code> text, if specified, is <u>always</u> the first chunk).
    </li>
    <li><code style="font-weight:bold;">onStart(data)</code> - the code you put in this will run at the start of the generation process. You can access the inputs being used with <code>data.inputs.instruction</code>, <code>data.inputs.startWith</code>, etc.</li>
    <li>
      <code style="font-weight:bold;">onFinish(data)</code> - the code you put in this will run at the end of the generation process. You can access the final text with <code>data.text</code>, and note that this <b>includes</b> the <code>startWith</code> text, if you specified any. If you want the
      output text <b>excluding</b> the <code>startWith</code>, then you can access that via <code>data.generatedText</code>. If you didn't specify any <code>startWith</code> then <code>data.generatedText</code> and <code>data.text</code> will be the same. You can use
      <code>data.liveResponseText</code> at any time to get the current text <i>including any edits that the user has made</i> using the edit button at the end of the response.
    </li>
    <li>
      <code style="font-weight:bold;">render(data)</code> - the code you put in this will run after every chunk, and value that you <code>return</code> from this function is what actually gets displayed. This allows you to transform what the AI writes into something else - e.g. convert asterisks
      around text to bold or italic HTML tags. <code>data.text</code> contains the text so far and <code>data.isPartial</code> tells you whether the text is partial/incomplete (i.e. the AI is still generating).
      <a href="https://perchance.org/ai-text-plugin-render-example#edit" target="_blank">Here's</a> a basic example, and <a href="https://perchance.org/ai-short-story-generator-example#edit" target="_blank">here's</a> one that uses <code>data.isPartial</code>.
    </li>
    <li><code style="font-weight:bold;">endButtons</code> - add <code>endButtons = none</code> to your prompt options if you don't want the edit/continue buttons to show at the end of the response.</li>
    <li>
      Note that <code>instruction</code>, <code>startWith</code>, and <code>stopSequences</code> can all be <i>functions</i> if you want. You return the value that you want to use. See <a href="https://perchance.org/ai-text-plugin-tester#edit" target="_blank">this</a> generator for an example where
      we use it to prevent evaluation of the square and curly blocks in the given <code>instruction</code> and <code>startWith</code>.
    </li>
    <li>There are some other features not listed here, but they're used in the examples list above. If there's a feature that you want, but can't find, feel free to ask for it on the community forum.</li>
  </ul>
  <p>Here's an example of using it in JavaScript function where we <code>console.log</code> each chunk, and also the final <code>generatedText</code>:</p>
  <pre>
async start() =>
  let result = await ai(\{
    instruction: "write a poem",
    onChunk: function(data) \{
      console.log("chunk:", data);
    \},
  \});
  console.log(result.generatedText, result);
</pre
  >
  <p>
    The <code>result.text</code> includes the <code>startWith</code> text, whereas <code>result.generatedText</code> doesn't, but in the above example they're equivalent because we didn't specify a <code>startWith</code>. Also note that <code>result</code> is also actually a
    <code>String</code> which is equivalent to <code>result.text</code>. So you can just write e.g. <code>foo.innerHTML = result</code> instead of <code>foo.innerHTML = result.text</code>.
  </p>
  <p><b>Notes:</b></p>
  <ul>
    <li>Text prompt/response data is <b>not</b> stored on the server - see <a href="https://lemmy.world/comment/5709061" target="_blank">this post</a> for more info.</li>
    <li>If you'd like to play around with running AI text generation models on your own machine ("locally"), then <a href="https://www.reddit.com/r/LocalLLaMA/top/?t=month" target="_blank">r/LocalLLama</a> is a good community to join.</li>
    <li>Each user can only have a few concurrent server requests, so if you have lots of completions pending on one page, they'll queue up.</li>
    <li>
      The model <b>may produce NSFW/adult-themed content</b> if instructed/prompted with NSFW/adult-themed terms. You should <b>treat this a bit like a Google search</b> - ask for inappropriate stuff, and you'll probably get inappropriate stuff. Please prompt responsibly. If the AI is producing
      inappropriate content without being prompted, you can try adding a sentence to your <code>instruction</code> telling it not to do that.
    </li>
    <li>
      The 19th day of every month is observed as 'Ad-viewer Appreciation Day' in the Perchance community. On this day we pay our respects to the non-logged-in users who fund the GPU servers by viewing ads on generators that import AI-based plugins. Logged-in users are encouraged to spare a moment
      for these anonymous benefactors, wishing for them a month of relevant and interesting ads, and thanking them for their tolerance of increased browser tab memory usage, and their indirect but valuable contribution to the Perchance community via the digital attention economy. May their mobile
      game ads not be too sus, and may the gameplay reflect the real gameplay even if only abstractly 🕯️
    </li>
    <li>Check out more plugins at <a href="/plugins">perchance.org/plugins</a></li>
  </ul>
</main>
<p style="text-align:center; font-size:200%; opacity:0.2; margin-top:0.5em;"><span>⚄&#xFE0E;</span></p>
<br /><br /><br />

<style>
  html {
    color-scheme: dark light;
  }
  main {
    text-align: left;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    background: light-dark(#fff, #101010);
    padding: 1em;
    border-radius: 3px;
    box-shadow:
      0 0.5px 0 0 #ffffff inset,
      0 1px 2px 0 #b3b3b3;
    box-shadow:
      0 0.5px 0 0 light-dark(#fff, #060606) inset,
      0 1px 2px 0 light-dark(#b3b3b3, #2c2c2c);
  }
  main p:first-child {
    margin-top: 0;
  }
  ul li {
    margin-top: 0.5em;
  }
  p {
    line-height: 1.4em;
  }
  body {
    background-color: #f6f6f6;
    background-color: light-dark(#f6f6f6, #000);
    color: black;
    color: light-dark(black, #d6d6d6);
  }
  pre {
    text-align: left;
    background: #333;
    background: light-dark(#333, #212121);
    color: #e2e2e2;
    padding: 1em;
    border-radius: 2px;
    tab-size: 2;
    -moz-tab-size: 2;
    -o-tab-size: 2;
    -webkit-tab-size: 2;
  }
  code {
    background: #eff0f1;
    background: light-dark(#eff0f1, #272727);
    padding: 1px 5px;
    white-space: nowrap;
  }
</style>
```

---

```perchance

// NOTE TO SELF: If you add more properties, make sure you add to the regex below, and the variable declarations in each 'branch'

$output(data, opts) =>
  if(data === undefined) return "(Error: you've input an empty value/variable into the text-to-image-plugin)";

  // Allow for `await generateImage("a cute cat", {resolution:"512x768", removeBackground:true})` type usage
  if(opts && typeof opts === "object") {
    opts.prompt = data;
    data = opts;
  }

  // if(options === undefined) options = {};

  let serverOrigin = "https://image-generation.perchance.org";

  let evaluatedInputs;

  // This is used for the heart-button gallery. It's a bit hacky, but most often devs will want the "open gallery" button to show a gallery with e.g. the same moderation options as the gallery that they've displayed on the page, if any.
  window.lastUsedTextToImagePluginGalleryIframeUrl = null;

  let shouldRemoveIframeOnFinish = false; // for the case where the iframe was added automatically - i.e. when called like:  `let result = await image({prompt:"a cute mouse"})`

  let galleryOptionsHash = null; // only used if this is a gallery call

  ////////////////////////////////////////////////
  //       set up handler for gallery           //
  ////////////////////////////////////////////////
  let pluginData;
  if(!window.___textToImagePluginData98420274) {
    window.addEventListener("message", function(e) {
      let origin = e.origin || e.originalEvent.origin;
      if(origin !== serverOrigin) {
        return;
      }
      if(e.data.openGallerySignal) {
        let ctn = document.createElement("div");
        let subChannelName = e.data.subChannelName;
        let url;
        if(window.lastUsedTextToImagePluginGalleryIframeUrl) {
          url = new URL(window.lastUsedTextToImagePluginGalleryIframeUrl);
          url.searchParams.set("subChannelName", subChannelName);
          url = url.href;
        } else {
          url = `${serverOrigin}/gallery?channel=${window.generatorName}&subChannel=${encodeURIComponent(subChannelName)}&sort=trending&timeRange=1-month&contentFilter=g`;
        }
        let backgroundColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "#242424" : "white";
        ctn.innerHTML = `<div onclick="this.remove()" style="backdrop-filter:brightness(0.3);position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;"><div style="position:fixed;top:5vh;bottom:5vh;left:5vh;right:5vh;background:${backgroundColor};border-radius:3px;"><iframe src="${url}" style="border:0;width:100%;height:100%;"></iframe></div></div>`;
        document.body.appendChild(ctn.firstElementChild);
      }
      if(e.data.savedImageToGallerySignal) {
        document.querySelectorAll(".text-to-image-plugin-gallery").forEach(el => {
          let targetOrigin = serverOrigin;
          el.contentWindow.postMessage({doRefreshIfSortingByRecent:true}, targetOrigin);

          // the code below is commented out because it doesn't work for the case where the user has switched the sort to recent (since, counter-intuitively, iframe's window.location can change, while iframe.src stays as the original value - I'm assuming this is due to cross-origin security stuff)
          // if(el.src.includes("sort=recent")) {
          //   // refresh galleries that are sorted by recent if the user makes a submission
          //   let url = new URL(el.src);
          //   url.searchParams.set("cacheBust", Math.random().toString());
          //   el.src = ""; // we do this instead of el.src=el.src because that doesn't work if the URL has a hash in it, and I might need to add data in the hash later
          //   setTimeout(() =>el.src=url.href, 700); // we need to wait a bit for the iframe to actually initiate a reload/refresh before setting the src again
          // }
        });
      }
      if(e.data.documentHeightChanged) {
        document.querySelectorAll(".text-to-image-plugin-gallery").forEach(el => {
          if(el.dataset.adaptiveHeight === "yes") {
            el.style.height = (e.data.newHeight+1)+"px";
            console.debug("Updated gallery height", e.data.newHeight);
          }
        });
      }
      if(e.data.customButtonClickEvent) {
        if(e.data.isButton2) {
          let handlerFn = pluginData.galleryCustomButton2ClickHandlers[e.data.galleryInstanceId];
          if(handlerFn) handlerFn(e.data.onClickHandlerData);
        } else {
          let handlerFn = pluginData.galleryCustomButtonClickHandlers[e.data.galleryInstanceId];
          if(handlerFn) handlerFn(e.data.onClickHandlerData);
        }
      }
    });
    window.___textToImagePluginData98420274 = {
      galleryCustomButtonClickHandlers: {},
      galleryCustomButton2ClickHandlers: {},
    };
  }
  pluginData = window.___textToImagePluginData98420274;

  if(data.gallery) {
    let sort = data.sort ? data.sort.evaluateItem : "recent";
    if(sort === "best") sort = "top"; // alias

    let contentFilter = data.contentFilter ? data.contentFilter.evaluateItem.toLowerCase() : "g";
    if(contentFilter === "pg-13") contentFilter = "pg13";
    if(contentFilter !== "pg13" && contentFilter !== "g") contentFilter = "g";

    let bannedUsers = data.bannedUsers ? data.bannedUsers.selectAll.map(item => item.toString()) : [];
    let bannedPromptPhrases = data.bannedPromptPhrases ? data.bannedPromptPhrases.selectAll.map(item => item.getRawListText.replace("/\\^", "/^")) : [];
    let bannedNegativePromptPhrases = data.bannedNegativePromptPhrases ? data.bannedNegativePromptPhrases.selectAll.map(item => item.getRawListText.replace("/\\^", "/^")) : [];

    let defaultSubChannelNames = [];
    if(data.defaultGalleryNames) {
      if(typeof data.defaultGalleryNames === "string") {
        defaultSubChannelNames = data.defaultGalleryNames.split(",").map(name => name.trim()).filter(name => name && /^[a-z0-9\-]+$/.test(name));
      } else {
        defaultSubChannelNames = data.defaultGalleryNames.selectAll.map(item => item+"");
      }
    }

    let timeRange = data.timeRange ? data.timeRange.evaluateItem : (sort === "recent" ? "all-time" : "1-month");
    let hideIfScoreIsBelow = data.hideIfScoreIsBelow !== undefined ? Number(data.hideIfScoreIsBelow.evaluateItem) : -1000000000;
    if(isNaN(hideIfScoreIsBelow)) hideIfScoreIsBelow = -1000000000;

    let galleryOptions = {sort, timeRange, hideIfScoreIsBelow, contentFilter, subChannel:"public"}; // this is also used for checking if gallery options have been udpated (see below)
    if(data.forceColorScheme) galleryOptions.forceColorScheme = data.forceColorScheme;

    const galleryInstanceId = "galleryInstanceId"+(Math.random().toString()+Math.random().toString()).replaceAll(".", "");

    let customButtonEmoji = null;
    let shouldShowCustomButton = false;
    let customButtonOptions = data.customButton || data.customButton1;
    if(customButtonOptions) {
      shouldShowCustomButton = true;
      if(customButtonOptions.onClick) pluginData.galleryCustomButtonClickHandlers[galleryInstanceId] = customButtonOptions.onClick;
      if(customButtonOptions.emoji) customButtonEmoji = customButtonOptions.emoji.evaluateItem;
    }

    let customButton2Emoji = null;
    let shouldShowCustomButton2 = false;
    if(data.customButton2) {
      shouldShowCustomButton2 = true;
      if(data.customButton2.onClick) pluginData.galleryCustomButton2ClickHandlers[galleryInstanceId] = data.customButton2.onClick;
      if(data.customButton2.emoji) customButton2Emoji = data.customButton2.emoji.evaluateItem;
    }

    let hashData = {galleryInstanceId, shouldShowCustomButton, customButtonEmoji, shouldShowCustomButton2, customButton2Emoji, bannedUsers, bannedPromptPhrases, bannedNegativePromptPhrases, injectedStyles:{}, defaultSubChannelNames};
    if(data.style) {
      let style = data.style.evaluateItem.trim();
      if(style.includes("background:")) {
        hashData.injectedStyles.background = (style.match(/(?:^|;) *background:(.+?)(?:;|$)/) || [])[1];
      } else if(style.includes("background-color:")) {
        hashData.injectedStyles.background = (style.match(/(?:^|;) *background-color:(.+?)(?:;|$)/) || [])[1];
      }
    }

    let otherUrlParams = {channel:window.generatorName};
    let iframeUrl = new URL(`${serverOrigin}/gallery`);
    Object.entries(galleryOptions).forEach(([key, value]) => iframeUrl.searchParams.set(key, value));
    Object.entries(otherUrlParams).forEach(([key, value]) => iframeUrl.searchParams.set(key, value));


    function makeGalleryIframeHtml() {
      let url = iframeUrl.href + `#data=${encodeURIComponent(JSON.stringify(hashData))}`;
      window.lastUsedTextToImagePluginGalleryIframeUrl = url;
      return `<iframe data-gallery-options="${encodeURIComponent(JSON.stringify(galleryOptions))}" data-adaptive-height="${data.adaptiveHeight ? "yes" : "no"}" style="width:100%; height:70vh; border:none; ${data.style || ""}" class="text-to-image-plugin-gallery" src="${url}" allow="clipboard-write"></iframe>`;
    }

    if(!document.querySelector(".text-to-image-plugin-gallery")) {
      setTimeout(() => {
        let marker = document.querySelector("#temporaryMarkerElForTextToImageGallery84738932");
        if(marker) marker.outerHTML = makeGalleryIframeHtml()
      }, 50);
      return `<span id="temporaryMarkerElForTextToImageGallery84738932"></span>`;
    } else {
      // update any gallery parameters if they have been changed:
      let galleryIframe = document.querySelector(".text-to-image-plugin-gallery");
      let newGalleryOptionsText = encodeURIComponent(JSON.stringify(galleryOptions));
      if(galleryIframe.dataset.galleryOptions !== newGalleryOptionsText) {
        galleryIframe.outerHTML = makeGalleryIframeHtml();
      }
      return "";
    }
  }





  ///////////////////////////////////////////////////////////////////////////////////////
  //              parse and evaluate prompt data/options from input                    //
  ///////////////////////////////////////////////////////////////////////////////////////
  const defaultGuidanceScale = 7;

  let d = {};
  // let dataInputWasNotAnOptionsObject = false;

  if(data.prompt === undefined) {
    d.prompt = data.evaluateItem.toString(); // they passed in some text directly like [image("a carrot")]
  } else {
    d.prompt = data.prompt.evaluateItem.toString();
  }
  // Apply some covenience fixes to the prompt, even though the plugin user should ideally fix this on their end:
  d.prompt = d.prompt.replace(/<span [^>]+______tippy-tooltip-[^>]+>(.+?)<\/span>/, "$1");

  // parse values from prompts like: `this is the prompt text (size:::400) (resolution:::512x768) (guidanceScale:::10)`
  if(d.prompt.includes(":::")) {
    let matches = [...d.prompt.matchAll(/\((seed|size|style|resolution|width|height|guidanceScale|saveTitle|saveDescription)\:\:\:/g)];
    // console.debug("matches:", matches);
    const numericProps = ["seed", "width", "height", "guidanceScale", "width", "height", "size"];
    for(let match of matches) {
      let re = new RegExp(`\\(${match[1]}\\:\\:\\:(.+?)\\).*?(?:\\:\\:\\:|$)`, "m");
      let value = (d.prompt.match(re) || [])[1]
      let key = match[1];
      if(value !== undefined) {
        d[key] = numericProps.includes(key) ? Number(value) : value;
        d.prompt = d.prompt.replace(`(${key}:::${value})`, "");
      }
    }
    d.prompt = d.prompt.trim();
  }
  if(!window.___t2i__parseNegativePrompt) {
    window.___t2i__parseNegativePrompt = function(str) {
      const prefix = '(negativePrompt:::';
      const start = str.indexOf(prefix);
      if (start === -1) return null;
      let depth = 0;
      let result = '';
      for(let i = start + prefix.length; i < str.length; i++) {
        if(str[i] === '(') {
          depth++;
        } else if (str[i] === ')') {
          if(depth === 0) {
            break;
          }
          depth--;
        }
        result += str[i];
      }
      return result;
    };
  }
  if(d.prompt.includes("(negativePrompt:::")) {
    let result = window.___t2i__parseNegativePrompt(d.prompt);
    if(result) {
      d.negativePrompt = result;
      d.prompt = d.prompt.replace(`(negativePrompt:::${d.negativePrompt})`, "");
      d.prompt = d.prompt.replace(`(negativePrompt:::${d.negativePrompt}`, ""); // since if final bracket is missing, then all following text is considered the negative prompt
    }
    d.prompt = d.prompt.trim();
  }

  if(!data.prompt) { // they passed in some text directly like [image("a carrot")], so add some defaults/fallbacks.
    if(d.seed === undefined) d.seed = -1;
    if(d.width === undefined) d.width = 300;
    if(d.height === undefined) d.height = 300;
    if(d.resolution === undefined) d.resolution = "512x512";
    if(d.guidanceScale === undefined) d.guidanceScale = defaultGuidanceScale;
    if(d.negativePrompt === undefined) d.negativePrompt = "";
    if(d.style === undefined) d.style = "";
  }


  // EDIT: Not going ahead with this for now in favor of a setting a global variable which contains data on the last-used prompt.
  // // NOTE: Originally `data` was the only param and it could be the prompt, or a promptOptions object/list.
  // // But I realised that it's not very ergonomic (see e.g. reddit.com/r/perchance/comments/yta11r), so now, in a backwards-compatible way,
  // // I'm allowing the user to pass the options as the second parameter instead. This just means that if data is a prompt (rather than a
  // // promptOptions object), then we use the `options` parameter (which defaults to an empty object) for the generation options:
  // if(dataInputWasNotAnOptionsObject) {
  //   data = options; // this
  // }

  if(!d.seed) d.seed = data.seed ? data.seed.evaluateItem : -1;
  if(!d.resolution) d.resolution = data.resolution ? data.resolution.evaluateItem : "512x512";
  if(!d.guidanceScale) d.guidanceScale = data.guidanceScale ? data.guidanceScale.evaluateItem : defaultGuidanceScale;
  if(!d.negativePrompt) d.negativePrompt = data.negativePrompt ? data.negativePrompt.evaluateItem : "";
  if(!d.width) d.width = data.width ? data.width.evaluateItem : undefined;
  if(!d.height) d.height = data.height ? data.height.evaluateItem : undefined;
  if(!d.style) d.style = data.style ? data.style.evaluateItem : "";
  if(!d.saveTitle) d.saveTitle = data.saveTitle ? data.saveTitle.evaluateItem : "";
  if(!d.saveDescription) d.saveDescription = data.saveDescription ? data.saveDescription.evaluateItem : "";


  // NOTE: This stuff is not longer needed because we do the parsing above regardless of whether they passed a plain string in, or a promptOptions object.
  // // if seed is specified within the prompt with the (key:::value) format - i.e. they used promptOptions input but specified the seed within promptOptions.prompt, and so long as promptOptions.seed is not specified, then we set the seed to the one specified in the prompt:
  // if(data.seed === undefined && d.prompt.includes("(seed:::")) {
  //   let seed = null;
  //   d.prompt = d.prompt.replace(/\(seed:::([0-9]+)\)/g, (m, p1) => { seed=Number(p1); return ""; });
  //   if(seed) {
  //     d.seed = seed;
  //   }
  // }
  // // same for guidanceScale:
  // if(data.guidanceScale === undefined && d.prompt.includes("(guidanceScale:::")) {
  //   let guidanceScale = null;
  //   d.prompt = d.prompt.replace(/\(guidanceScale:::([0-9]+)\)/g, (m, p1) => { guidanceScale=Number(p1); return ""; });
  //   if(guidanceScale) {
  //     d.guidanceScale = guidanceScale;
  //   }
  // }
  // // same for width:
  // if(data.guidanceScale === undefined && d.prompt.includes("(width:::")) {
  //   let width = null;
  //   d.prompt = d.prompt.replace(/\(width:::([0-9]+)\)/g, (m, p1) => { width=Number(p1); return ""; });
  //   if(width) {
  //     d.width = width;
  //   }
  // }
  // // same for height:
  // if(data.guidanceScale === undefined && d.prompt.includes("(height:::")) {
  //   let height = null;
  //   d.prompt = d.prompt.replace(/\(height:::([0-9]+)\)/g, (m, p1) => { height=Number(p1); return ""; });
  //   if(height) {
  //     d.height = height;
  //   }
  // }
  // // same for size:
  // if(data.guidanceScale === undefined && d.prompt.includes("(size:::")) {
  //   let size = null;
  //   d.prompt = d.prompt.replace(/\(size:::([0-9]+)\)/g, (m, p1) => { size=Number(p1); return ""; });
  //   if(size) {
  //     d.size = size;
  //   }
  // }


  ////////////////////////////////////////////////
  //           sanity checks on inputs          //
  ////////////////////////////////////////////////

  if(d.size && d.resolution && d.resolution.split("x")[0] !== d.resolution.split("x")[1]) {
    return `(text-to-image-plugin: <b>size</b> is only a valid parameter with square resolutions. use <b>width</b> and <b>height</b> instead)`;
  }

  if(d.guidanceScale < 1 || Math.round(d.guidanceScale) !== d.guidanceScale) {
    return `(text-to-image-plugin: <b>guidanceScale</b> should be a whole number between 1 and 30, inclusive)`;
  }

  if(!["512x512", "512x768", "768x512", "768x768"].includes(d.resolution)) {
    return "(text-to-image-plugin: Currently, the only valid resolutions are 512x512, 768x768, 512x768 and 768x512)";
  }



  ////////////////////////////////////////////////
  //        un-shortcut size/width/height       //
  ////////////////////////////////////////////////
  let resW = Number(d.resolution.split("x")[0]);
  let resH = Number(d.resolution.split("x")[1]);
  let widthHeightCss = "";
  if(d.size) {
    let size = d.size.evaluateItem;
    if(typeof size === "number") size += "px";
    widthHeightCss = `width:${size}`;
  } else {
    if(d.width && !d.height) {
      d.width = d.width.evaluateItem;
      if(typeof d.width === "number") d.width += "px";
      widthHeightCss = `width:${d.width}`;
      // d.height = d.width * (resH/resW);
    } else if(!d.width && d.height) {
      d.height = d.height.evaluateItem;
      if(typeof d.height === "number") d.height += "px";
      widthHeightCss = `height:${d.height}`;
      // d.width = d.height * (resW/resH);
    } else if(!d.width && !d.height) {
      // make the smallest side 300px by default:
      let defaultSize = 300;
      if(d.resolution === "768x768") defaultSize = 450;
      if(resW > resH) {
        d.height = defaultSize;
        widthHeightCss = `height:${d.height}px`; // can't add max-height:100% here - it breaks stuff, like ai-character-chat
        // d.width = d.height * (resW/resH);
      } else {
        d.width = defaultSize;
        widthHeightCss = `width:${d.width}px`; // can't add max-width:100% here - it breaks stuff, like ai-character-chat
        // d.height = d.width * (resH/resW);
      }
    } else if(d.width && d.height) {
      if(typeof d.width === "number") d.width += "px";
      if(typeof d.height === "number") d.height += "px";
      widthHeightCss = `width:${d.width}; height:${d.height}`;
    }
  }

  if(d.style && /[;\s]?(width|height):/.test(d.style)) widthHeightCss = "";

  if(!CSS.supports("aspect-ratio", "1/2")) { // hackily help old browsers that don't support aspect-ratio if possible
    let width = (widthHeightCss.match(/width:([^;]+)px;?/) || [])[1];
    if(width && !widthHeightCss.includes("height") && !isNaN(Number(width))) {
      widthHeightCss += `; height:${Number(width) * (resH/resW)}px;`;
    }
    let height = (widthHeightCss.match(/height:([^;]+)px;?/) || [])[1];
    if(height && !widthHeightCss.includes("width") && !isNaN(Number(height))) {
      widthHeightCss += `; width:${Number(height) * (resW/resH)}px;`;
    }
  }

  let requestId = Math.random().toString();
  let privateIframeId = "id" + Math.random().toString().replace(".", "");

  // let iframePromiseResolver;
  // let iframePromise = new Promise(r => iframePromiseResolver=r);
  // let canvasPromiseResolver;
  // let canvasPromise = new Promise(r => canvasPromiseResolver=r);
  // let dataUrlPromiseResolver;
  // let dataUrlPromise = new Promise(r => dataUrlPromiseResolver=r);
  let onFinishPromiseResolver;
  let onFinishPromise = new Promise(r => onFinishPromiseResolver=r);


  async function messageHandler(event) {
    if(event.data.type === 'finished' && event.data.id === privateIframeId) {
      // TODO: Should remove this message handler when it's finished, but

      function drawDataURLToCanvas(dataURL) {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
          };
          img.src = dataURL;
        });
      }

      async function removeBackground(imageUrl) { // can be data url or normal URL
        if (!removeBackground.transformers) {
          const transformers = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');
          transformers.env.allowLocalModels = false;
          transformers.env.backends.onnx.wasm.proxy = true;
          removeBackground.transformers = transformers;
        }

        const { AutoModel, AutoProcessor, RawImage } = removeBackground.transformers;
        if (!removeBackground.model || !removeBackground.processor) {
          removeBackground.model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
            config: { model_type: 'custom' },
          });

          removeBackground.processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
            config: {
              do_normalize: true,
              do_pad: false,
              do_rescale: true,
              do_resize: true,
              image_mean: [0.5, 0.5, 0.5],
              feature_extractor_type: "ImageFeatureExtractor",
              image_std: [1, 1, 1],
              resample: 2,
              rescale_factor: 0.00392156862745098,
              size: { width: 1024, height: 1024 },
            }
          });
        }

        const image = await RawImage.fromURL(imageUrl);
        const { pixel_values } = await removeBackground.processor(image);
        const { output } = await removeBackground.model({ input: pixel_values });
        const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        // Draw original image output to canvas
        ctx.drawImage(image.toCanvas(), 0, 0);

        // Update alpha channel
        const pixelData = ctx.getImageData(0, 0, image.width, image.height);
        for (let i = 0; i < mask.data.length; ++i) {
          pixelData.data[4 * i + 3] = mask.data[i];
        }
        ctx.putImageData(pixelData, 0, 0);

        return canvas.toDataURL('image/png');
      }


      let dataUrl = event.data.dataUrl;
      if(data.removeBackground) {
        let pngDataUrlWithBgRemoved = await removeBackground(dataUrl).catch(console.error);
        if(pngDataUrlWithBgRemoved) dataUrl = pngDataUrlWithBgRemoved;
      }

      let canvas = await drawDataURLToCanvas(dataUrl);
      let iframe = document.querySelector(`iframe.${privateIframeId}`); // NOTE: may be null if it has been removed! (todo: keep original reference around instead of querySelector?)

      if(!iframe) window.removeEventListener('message', messageHandler); // iframes not in DOM cannot send any more messages

      let outputData = new String(dataUrl);
      outputData.canvas = canvas;
      outputData.iframe = iframe;
      outputData.dataUrl = dataUrl;
      outputData.inputs = evaluatedInputs;
      outputData.inputs.seed = event.data.seedUsed;

      if(iframe) iframe.textToImagePluginOutput = outputData;

      if(shouldRemoveIframeOnFinish) {
        delete outputData.iframe;
        iframe.remove();
        window.removeEventListener('message', messageHandler);
      }

      if(data.onFinish) {
        data.onFinish(outputData);
      }
      onFinishPromiseResolver(outputData);
    }
  }
  window.addEventListener('message', messageHandler);

  let iframeExistentPollInterval = setInterval(() => {
    if(!document.querySelector(`iframe.${privateIframeId}`)) {
      clearInterval(iframeExistentPollInterval);
      window.removeEventListener('message', messageHandler);
    }
  }, 1000*60); // not important to remove listener immediately, so long interval is fine

  function blobToDataUrl(blob) {
    return new Promise(r => {
      const reader = new FileReader();
      reader.onload = () => r(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  let referenceImage = null;
  if(data.referenceImage) {
    referenceImage = {};
    // url can actually be a blob or a blob URL, in which case we postMessage the data to the iframe
    let isBlobby = data.referenceImage.url instanceof Blob; // blobby means Blob or blob URL string
    let url, blobby;

    if(isBlobby) blobby = data.referenceImage.url;
    else url = data.referenceImage.url.evaluateItem;

    if(url.startsWith("blob:")) {
      isBlobby = true;
      blobby = url;
      url = null;
    }

    if(isBlobby) {
      referenceImage.url = "<data-via-postmessage>";
      (async () => {
        let blob;
        if(typeof blobby === "string" && blobby.startsWith("blob:")) {
          blob = await fetch(blobby).then(r => r.blob());
        } else {
          blob = blobby;
        }
        let dataUrl = await blobToDataUrl(blob);
        window.addEventListener('message', function(event) {
          if(event.data.type === 'readyForData' && event.data.id === privateIframeId) {
            document.querySelector(`iframe.${privateIframeId}`).contentWindow.postMessage({id:privateIframeId, referenceImageDataUrl:dataUrl}, serverOrigin);
          }
        });
      })();
    } else {
      referenceImage.url = url;
    }
    referenceImage.blur = data.referenceImage.blur.evaluateItem;
    // if(referenceImage.url && !referenceImage.url.startsWith("https://user-uploads.perchance.") && !referenceImage.url.startsWith("data:")) return `referenceImage.url must either be a 'data URL' (starting with 'data:') or a https://user-uploads.perchance.org URL - i.e. an image that has been uploaded to https://perchance.org/upload - the URL you've used is: '${referenceImage.url && typeof referenceImage.url === "string" && referenceImage.url.length > 30 ? referenceImage.url.slice(0, 30)+"..." : referenceImage.url}'.`;
    if(referenceImage.blur > 1 || referenceImage.blur < 0) return `referenceImage.blur must be between 0 and 1, but is instead '${referenceImage.blur > 1}'.`
  }

  window.addEventListener('message', function(event) {
    if(event.data.type === 'readyForData' && event.data.id === privateIframeId) {
      let iframe = document.querySelector(`iframe.${privateIframeId}`);
      if(iframe) iframe.contentWindow.postMessage({type:"originNotify", frameId:privateIframeId}, serverOrigin);
    }
  });

  let urlHashData = {
    saveChannel: window.generatorName,
    saveTitle: d.saveTitle,
    saveDescription: d.saveDescription,
    prompt: d.prompt,
    seed: d.seed,
    resolution: d.resolution,
    guidanceScale: d.guidanceScale,
    defaultGuidanceScale,
    negativePrompt: d.negativePrompt,
    requestId: requestId,
    forceColorScheme: data.forceColorScheme,
    verifyOnly: data.verifyOnly,
    iframeId: privateIframeId,
    hideGalleryButtons: data.hideGalleryButtons,
    removeBackground: data.removeBackground,
    referenceImage,
  };

  // clone input for onFinish data:
  evaluatedInputs = JSON.parse(JSON.stringify(d));

  let iframeId = data.id ? data.id.evaluateItem : "";
  if(iframeId) {
    setTimeout(() => {
      document.querySelector("#"+iframeId).reload = function() {
        let src = this.src;
        this.src = "";
        setTimeout(() =>this.src=src, 700);
      };
    }, 500);
  }

  window.lastTextToImagePrompt = d.prompt;
  if(data.prompt) { // <-- i.e. if they passed a promptOptions object
    data.lastUsedPrompt = d.prompt;
    data.lastUsedNegativePrompt = d.negativePrompt;
  }

  // VERY lazily load the iframe (only when screen actually intersects) because some people add a lot of images in subsections and in several different tabs of tabs-plugin, etc.
  // This ensures they don't spam the server, and the visible ones get generated first.
  setTimeout(async () => {
    // the dev may have generated the HTML, but not actually added it to the DOM for a while, so we wait up to 5 mins for it
    let waitedSeconds = 0;
    while([...document.querySelectorAll(".text-to-image-plugin-image-iframe")].filter(el => el.dataset.alreadyAddedIntersectionObserver === "no").length === 0) {
      await new Promise(r => setTimeout(r, 500));
      waitedSeconds += 0.5;
      if(waitedSeconds > 60*5) return;
    }
    for(let el of [...document.querySelectorAll(".text-to-image-plugin-image-iframe")]) {
      if(el.dataset.alreadyAddedIntersectionObserver === "yes") continue;
      el.dataset.alreadyAddedIntersectionObserver = "yes";

      let observer1, observer2;

      let rootMarginSize = Math.min(1000, (window.innerHeight*2));
      if(window.innerWidth < 600) {
        rootMarginSize = Math.min(1500, (window.innerHeight*3)); // larger on mobile because e.g. images that might otherwise be displayed side by side are instead displayed vertically
      }

      function handler(entries) {
        if(entries[0].isIntersecting) {
          // console.debug("t2i iframe: Visible");
          if(!el.src) {
            el.removeAttribute("srcdoc");
            el.src = el.dataset.src;
            observer1.disconnect();
            observer2.disconnect();
          }
        } else {
          // console.debug("t2i iframe: NOT Visible");
        }
      }
      observer1 = new IntersectionObserver(handler, {
        root: document.documentElement, // otherwise I think it uses the top-level viewport? either way, it doesn't seem to work without specifying this.
        rootMargin: rootMarginSize+"px", // it's important that this is quite big - so that e.g. mobile users don't have to scroll down to trigger stuff. we basically want to trigger ~all visible elements anyway - just not stuff hidden within e.g. tabs plugin or whatever.
      });
      observer1.observe(el);
      // for some reason, in some situations, the above intersection observer was reporting the `root` and `el` bounding rects as 0x0x0x0. Adding a second observer using the viewport root fixes this:
      observer2 = new IntersectionObserver(handler, {
        rootMargin: rootMarginSize+"px",
      });
      observer2.observe(el);
    }
  }, 100); // CAUTION: do not remove/lower this delay. Some generators may create a large "feed" of images, and expect them to be lazy-loaded when scrolled to (e.g. AI chat feeds), so if you add the intersection observers ~synchronously, they could be triggered during the process of actually generating the feed, which would cause them to all start generating during page load.

  // let outputString = new String(`<iframe ${iframeId ? `id="${iframeId}"` : ""} class="text-to-image-plugin-image-iframe ${privateIframeId}" data-already-added-intersection-observer="no" data-src="${serverOrigin}/embed#${encodeURIComponent(JSON.stringify(urlHashData))}" style="border:0; background:transparent; ${widthHeightCss}; aspect-ratio:${resW}/${resH}; ${d.style}"></iframe>`);
  // // leaving these out for now in favor of 'onFinish' in prompt options
  // // outputString.dataUrl = dataUrlPromise;
  // // outputString.canvas = canvasPromise;
  // outputString.onFinishPromise = onFinishPromise;
  // outputString.iframeHtml = outputString;
  // return outputString;

  // we return the promise which stringifies into the iframe html, we can write [textToImage(promptOptions)] and while also being able to write `let result = await textToImage(promptOptions);`
  let outputString = `<iframe ${iframeId ? `id="${iframeId}"` : ""} class="text-to-image-plugin-image-iframe ${privateIframeId}" data-already-added-intersection-observer="no" data-src="${serverOrigin}/embed#${encodeURIComponent(JSON.stringify(urlHashData))}" style="border:0; background:transparent; ${widthHeightCss}; aspect-ratio:${resW}/${resH}; ${d.style}"></iframe>`;
  let outputStringHasBeenRead = false;
  onFinishPromise.toString = function() {
    outputStringHasBeenRead = true;
    return outputString;
  };
  // onFinishPromise.iframeHtml = outputString;
  Object.defineProperty(onFinishPromise, 'iframeHtml', {
    get: function() {
      outputStringHasBeenRead = true;
      return outputString;
    }
  });
  Object.defineProperty(onFinishPromise, 'evaluateItem', {
    get: function() {
      outputStringHasBeenRead = true;
      return outputString;
    }
  });
  onFinishPromise.onFinishPromise = onFinishPromise;

  // trigger the loading automatically if they haven't added the iframe to the document:
  setTimeout(() => {
    if(!outputStringHasBeenRead && !iframeId && !document.querySelector(`.${privateIframeId}`)) {
      shouldRemoveIframeOnFinish = true;
      let div = document.createElement("div");
      div.innerHTML = outputString.replace(`data-already-added-intersection-observer="no"`, "");
      let iframe = div.firstElementChild;
      iframe.style.cssText = `opacity:0; pointer-events:none; position:fixed; top:0; left:0;`;
      document.body.append(iframe);
      iframe.src = iframe.dataset.src;
    }
  }, 150); // this should be longer than 100ms for backward-compat because then it runs after the intersection observer is added, which means it wouldn't have loaded anyway, so it guards against the case where they're just a bit slow to add it to the HTML doc.

  return onFinishPromise;


character
  a {mech|demon|cyberpunk} {warrior|minion|samurai}

place
  soviet russia
  a small village
  a mountainous region
  an underwater cavern

season
  winter
  summer

prompt
  detailed painting of [character] in [place], [season]



```

```html
<div style="display:[window.generatorName === 'text-to-image-plugin' ? 'none' : 'block'];color:red; font-weight:bold; padding:3rem;">
  Heads up! This is a fork/remix of the <a href="/text-to-image-plugin" target="_blank">text-to-image-plugin</a>, but unfortunately it's a really bad idea to fork this plugin, since its code is 'coupled' with the server code, so if I need to change the server code, your version of this plugin will
  likely break. If you'd like new features, best to ask for them on the community forum so your generators don't randomly break in the future when I update the server code. Alternatively, you can create a new plugin that <u>imports the official version of this plugin</u> - i.e. basically create a
  "wrapper" plugin that changes/expands on the plugin's behavior
</div>

<h1>🤖 Text to Image Plugin 🎨</h1>

<main>
  <p>
    This plugin allows you input some text and get an image out. It doesn't run on your actual device like other Perchance plugins because it requires too much computational power (and would require a 3GB download), so it runs on
    <a href="https://en.wikipedia.org/wiki/Server_(computing)" target="_blank">server</a> GPUs, which means it costs me money to run. For this reason, this plugin is funded with ads, so
    <b style="color:red;">an ad will appear on your generator <u>for non-logged-in users</u> if you import this plugin</b>. The ad will appear at the bottom of the screen
    <a href="https://user.uploads.dev/file/e3cdfc34728610cf6e351b72052ef0c1.jpeg" target="_blank" title="graphic design is my passion">like this</a>. The ad will go away if you remove the plugin, of course. <b></b> Please see the notes at the end of this page for more info.
  </p>

  <p>To use this plugin, you'll first need to import it by adding this line to your lists editor:</p>
  <pre>
image = \{import:text-to-image-plugin\}
</pre
  >
  <p>And now try putting this in your lists editor:</p>
  <pre>
character
  a \{mech|demon|cyberpunk\} \{warrior|minion|samurai\}

place
  soviet russia
  a small village
  a mountainous region
  an underwater cavern

season
  winter
  summer
  
prompt
  detailed painting of \[character\] in \[place\], \[season\]
  
output
  \[image(prompt)\]
</pre
  >
  <p>Now just write <code>\[output\]</code> in the HTML wherever you want an image to appear. Here's a live, working example of what that outputs:</p>
  <p id="outputEl1" style="text-align:center;">[$output(prompt)]</p>
  <p style="text-align:center;"><button onclick="update(outputEl1)">randomize</button></p>

  <p>
    You can hover your mouse over the image (or long-press on mobile) to see the prompt that was used, or click the info icon in the corner of the image. You can also manually display the prompt below the image by using the special <code>lastTextToImagePrompt</code> variable that this plugin
    creates:
  </p>
  <pre>
output
  \[image(prompt)\] &lt;br&gt; \[lastTextToImagePrompt\]
</pre
  >
  <p><a href="https://perchance.org/text-to-image-plugin-example-4#edit" target="_blank">Here's an example generator</a> that uses the above code. Try playing around with the lists and saving your own copy.</p>
  <p>
    As the name suggests, <code>\[lastTextToImagePrompt\]</code> will always contain the most recently used prompt. If you instead wrote <code> \[image(prompt)\] … \[prompt\]</code> then the prompt used to generate the image (seen on hover) and the prompt output under the image would be different,
    because each time <code>prompt</code> is evaluated, it is randomized (it's just a normal Perchance list, after all).
  </p>

  <p>If you want the prompt text to be <i>above/before</i> the image, you can do that like this:</p>
  <pre>
output
  \[p = prompt.evaluateItem\] &lt;br&gt; \[image(p)\]
</pre
  >
  <p>
    <a href="https://perchance.org/text-to-image-plugin-example#edit" target="_blank">Here's an example generator</a> that uses the above code. And <a href="https://perchance.org/multiple-images-with-text-to-image-plugin#edit" target="_blank">this example</a> shows how to add multiple images to your
    generator.
  </p>
  <p><a href="https://perchance.org/text-to-image-with-user-input-example#edit" target="_blank">Here's an example generator</a> that has multiple images and also allows the user to input a text prompt.</p>

  <p>There are some options/settings that you can set two different ways - the first is by putting them in a promptData list like this:</p>
  <pre>
promptData
  prompt = painting of \[character\] in \[place\], \[season\]
  seed = 123
  size = 400  <span style="opacity:0.5">// size is only a valid property for square resolutions</span>
  style = border:4px solid blue; margin-top:20px; <span style="opacity:0.5">// CSS styles</span>
</pre>
  <p>You'd then write <code>\[image(promptData)\]</code> to generate an image using those settings (and in this case you can use <code>\[promptData.lastUsedPrompt\]</code> instead of <code>\[lastTextToImagePrompt\]</code> to get the prompt that was used if you want).</p>
  <p>The second way is to put the options directly in your prompt text like this:</p>
  <pre>
prompt
  \[character\] in \[place\] (size:::400) (seed:::123)
  
output
  \[image(prompt)\]
</pre
  >
  <p>
    <a href="https://perchance.org/text-to-image-plugin-options-in-prompt-example#edit" target="_blank">Here's an example generator</a> that has the options/settings within the prompt text itself. The options should always be at the end of the prompt, and should follow the
    <code>(name:::value)</code> format.
  </p>
  <p>You can of course omit settings that you don't want to customize.</p>
  <p>You can choose between 3 different resolutions using the <code>resolution</code>. The valid resolution values are 512x512, 512x768 and 768x512:</p>
  <pre>
promptData
  prompt = fantasy \{forest|city|village|cafe|cavern|island|plains|castle|canyon|supercity|megalopolis\}, extremely detailed oil painting, unreal 5 render, rhads, bruce pennington, studio ghibli, tim hildebrandt, digital art, octane render, beautiful composition, trending on artstation, award-winning photograph, masterpiece
  resolution = 512x768
  width = 400  <span style="opacity:0.5">// height will be auto-chosen based on aspect ratio if omitted, and vice versa for width</span>
</pre>
  <p><a href="https://perchance.org/text-to-image-plugin-example-3#edit" target="_blank">Here's an example generator</a> that uses the above code, and here's a live demo of that:</p>
  <p id="outputEl2" style="text-align:center;">
    [$output({prompt:"fantasy {forest|city|village|cafe|cavern|island|plains|castle|canyon|supercity|megalopolis}, extremely detailed oil painting, unreal 5 render, rhads, bruce pennington, studio ghibli, tim hildebrandt, digital art, octane render, beautiful composition, trending on artstation,
    award-winning photograph, masterpiece", resolution:"512x768", width:400})]
  </p>
  <p style="text-align:center;"><button onclick="update(outputEl2)">randomize</button></p>

  <p>There are a couple of other parameters to play with:</p>
  <ul>
    <li>
      <b><code>negativePrompt</code></b
      >: Tell the AI what you <u>don't</u> want in the image. E.g. if you don't want any blurriness in the output image, you'd write something like <code>negativePrompt = blur, blurry image, motion blur</code>. Here's
      <a href="https://perchance.org/negative-prompt-example-text-to-image-plugin#edit" target="_blank">an example generator</a> showing this feature.
    </li>
    <li>
      <b><code>guidanceScale</code></b
      >: Roughly speaking, this controls how much the output image "matches" the prompt. You can make the value higher to make the output "match" the prompt more, at the expense of realism. The default value is 7, the minimum is 1, and the maximum is 30.
    </li>
  </ul>

  <p>You'll notice that when you hover your mouse over the image there's a button which opens a menu that allows you to save images to a public gallery (for your generator), and to display said gallery. You can set the title and description that a gallery image will be saved with like this:</p>
  <pre>
promptData
  prompt = ...
  saveTitle = ...
  saveDescription = ...
</pre
  >
  <p>If you don't set a <code>saveTitle</code> and <code>saveDescription</code>, then by default the title will be the part of the prompt that comes before the first full-stop/comma/question-mark/exclamation-mark, and the description will be the whole prompt.</p>

  <p>After an image has finished generating, if you mouseover it, you'll notice some buttons. One of the buttons opens a menu which shows a button to download the image, and to save to a gallery, or to open the gallery. You can hide the gallery buttons like this:</p>
  <pre>
promptData
  prompt = ...
  hideGalleryButtons = true
</pre
  >

  <h2 style="margin-top:3rem;">Gallery Options</h2>
  <p>If you'd like to display the gallery on your page, rather than users having to click the button to open it, you can use "special" options list with the <code>gallery</code> property like this:</p>
  <pre>
galleryOptions
  gallery = true
  sort = top <span style="opacity:0.5">// or 'recent' or 'trending'</span>
  contentFilter = g <span style="opacity:0.5">// or 'pg13' for looser moderation</span>
  timeRange = 1-week
  hideIfScoreIsBelow = -2 <span style="opacity:0.5">// images will be removed if they get down-voted to a score below -2</span>
  adaptiveHeight = true <span style="opacity:0.5">// expand height to fit all images (so there's no scrollbar on the gallery)</span>
  style = ... <span style="opacity:0.5">// optional CSS styles (you can delete this line)</span>
  customButton = ... <span style="opacity:0.5">// see below for details</span>
  customButton2 = ... <span style="opacity:0.5">// see below for details</span>
  defaultGalleryNames = characters,memes,chat <span style="opacity:0.5">// clickable gallery names displayed by default</span>
</pre>
  <p>And then just put this in your HTML editor (bottom-right editor):</p>
  <pre>
\[image(galleryOptions)\]
</pre
  >
  <p>
    The valid values for <code>timeRange</code> are: <code>1-day</code>, <code>3-day</code>, <code>1-week</code>, <code>1-month</code>, <code>1-year</code>, <code>all-time</code>.
    <a href="https://perchance.org/text-to-image-plugin-gallery-example#edit" target="_blank">Here's an example generator</a> that displays the gallery.
  </p>

  <h2 style="margin-top:3rem;">Gallery Moderation</h2>
  <p>
    You can ban users and prompt phrases from the gallery using the <b>bannedUsers</b>, <b>bannedPromptPhrases</b>, and <b>bannedNegativePromptPhrases</b> options. Have a look at <a href="https://perchance.org/text-to-image-gallery-moderation-example#edit" target="_blank">this example</a> to see
    these features in action.
  </p>
  <pre>
galleryOptions
  gallery = true
  <span style="opacity:0.5">// ...</span>
  bannedUsers <span style="opacity:0.5">// click the settings button at the top of the gallery and type "admin" to toggle admin mode on, then double-click on an image to get the user ID of the creator.</span>
    263efb15c47c2d2f398e91bf169f50d4a0ca69251638c9d0eb5823c0e4fba538
    f50d4a0ca69251638c9d0eb5823c0e4fba538263efb15c47c2d2f398e91bf169
  bannedPromptPhrases
    pg13:blood <span style="opacity:0.5">// ban the word 'blood' in pg13 mode</span>
    /twin.?towers?/ <span style="opacity:0.5">// example of 'regex'-based pattern matching to ban 'twin towers' or 'twin-tower' or 'twin_towers', and so on</span>
    pg13:/\b(gore|blood)\b/i <span style="opacity:0.5">// another example of 'regex'-based pattern matching - uses word boundaries and case-insensitive matching</span>
  bannedNegativePromptPhrases
    pg13:wearing clothes <span style="opacity:0.5">// ban the word 'wearing clothes' in the *negative* prompt when in pg13 mode</span>
</pre>
  <p>
    You can click the settings button at the top of the gallery and type "admin" to toggle on "admin mode". This will show images that contain banned phrases with a red border instead of hiding them (useful for debugging regexes and ensuring that your ban lists aren't banning harmless prompts), and
    you can double-click on any image to get the user ID of the creator. Again, look at <a href="https://perchance.org/text-to-image-gallery-moderation-example#edit" target="_blank">this example</a>, for an example of these moderation features.
  </p>

  <h2 style="margin-top:3rem;">Custom Buttons in Gallery</h2>
  <p>You can add a custom button to each gallery image, and when the user clicks it, you can run some code based on that:</p>
  <pre>
galleryOptions
  gallery = true
  customButton
    emoji = ⭐
    onClick(data) =>
      <span style="opacity:0.5">// This code runs when the user clicks on the custom button.</span>
      <span style="opacity:0.5">// The 'data' variable includes information about the image they clicked your custom button on: data.imageId, data.imageUrl, data.userId, data.isNsfw, data.prompt, data.negativePrompt, data.guidanceScale, data.seed, data.galleryName</span>
      console.log(data);
</pre>
  <p><a href="https://perchance.org/text-to-image-gallery-custom-button-example#edit" target="_blank">Here's an example</a> of a custom button that shows a fullscreen version of the image when the custom button is clicked.</p>
  <p>
    You can create two different custom buttons: <code>customButton</code> and <code>customButton2</code>. <a href="https://perchance.org/text-to-image-gallery-custom-button2-example#edit" target="_blank">See this page</a> for an example that uses <code>customButton2</code> to add a comments box for
    each image in the gallery. If you need more buttons, then you could make one of the buttons show a popup menu which contains a list of actions the user can take for that image.
  </p>

  <h2 style="margin-top:3rem;">Advanced Usage</h2>
  <p>If you know JavaScript, then here's some code demonstrating how to use this plugin in your functions:</p>
  <pre>
async start() =>
  let result = await image(\{prompt:"a cute mouse"\});
  document.body.append(result.canvas);
  imageEl.src = result.dataUrl;
  console.log("prompt used:", result.inputs.prompt);
  console.log("all inputs used:", result.inputs);
</pre
  >
  <p><a href="https://perchance.org/text-to-image-plugin-programmatic-example#edit" target="_blank">Here's an example</a> of the above code. Also check <a href="https://perchance.org/text-to-image-canvas-simple-example#edit" target="_blank">this example</a>.</p>
  <p>Also, here's a <b>simplified</b> version of the above example:</p>
  <pre>
async start() =>
  imageEl.src = await image("a cute mouse");
</pre
  >
  <p>And here's an example showing how you can put options in the second argument if the first one is a string, and this also shows the <code>removeBackground</code> option:</p>
  <pre>
imageEl.src = await image("a cute mouse", \{resolution: "512x768", removeBackground:true\});
</pre
  >
  <p>
    This works because if we pass plain text into the plugin, it interprets it as the <code>prompt</code>. Also, the resulting 'object' returned by the plugin is always a <code>String</code> object with some extra properties added (i.e. <code>canvas</code>, <code>dataUrl</code>,
    <code>iframe</code>), so you can write <code>imageEl.src=result</code> instead of <code>imageEl.src=result.dataUrl</code>. They're the same.
  </p>
  <p>Also, the iframe has a property <code>iframe.textToImagePluginOutput</code> which is added after the generation is finished, and you can use that to access the image either as a HTML5 canvas or as a Data URL:</p>
  <pre>
iframe.textToImagePluginOutput.canvas
iframe.textToImagePluginOutput.dataUrl
iframe.textToImagePluginOutput.inputs.prompt
iframe.textToImagePluginOutput.inputs.negativePrompt
iframe.textToImagePluginOutput.inputs.seed
...
</pre
  >
  <p><b>Notes:</b></p>
  <ul>
    <li>
      You can use <a href="https://perchance.org/text-to-image-plugin-example#edit" target="_blank">this example</a> to get started. And <a href="https://perchance.org/text-to-image-plugin-example-2#edit" target="_blank">here's another</a> that hides the irrelevant parts of the prompt from the user.
    </li>
    <li>Images are <b>not</b> stored on the server unless the user explicitely saves them to the gallery - see <a href="https://lemmy.world/comment/5709061" target="_blank">this post</a> for more info.</li>
    <li>
      If you want to programmatically get the actual image data that is generated - so e.g. you can draw some text on it, or make it greyscale, or collage multiple images together, or whatever, check out
      <a href="https://perchance.org/text-to-image-canvas-simple-example#edit" target="_blank">this example</a>.
    </li>
    <li>
      The quality of the output image can change <b>dramatically</b> depending on the wording in your prompt. You can use a generator <a href="https://perchance.org/ai-text-to-image-generator" target="_blank">like this</a> to play around with your prompt design (click the info icon on the output
      images to see the full prompt used).
    </li>
    <li>You can call the <code>promptData</code> list whatever you want. If your settings list was called <code>promptSettings</code> then you'd write <code>\[image(promptSettings)\]</code> to generate the output image. You can have many prompt-settings lists in one generator.</li>
    <li>
      The <code>seed</code> parameter should be any number like 3834329 or 9278236492. A <code>seed</code> of -1 is default and means "choose a random seed for me". If you provide the same seed with the same prompt, it should generate a very similar picture (ideally the same, but not always exact
      due to GPU hardware technicalities). But <b>note</b>: I'll be upgrading the machine learning models that power this as new ones are released, and during the upgrades, the image that a seed+prompt combination "refers to" will change.
    </li>
    <li>
      If a seed of -1 is used (which again, is default), then an icon will appear (when you hover over the image) to allow you to try generating it again to get a different result. If you want to add your own "try again" button that just regenerates the image and nothing else, then add
      <code>id=yourImageId</code> to your <code>promptData</code> list and then use this code to create your "try again" button: <code>&lt;button onclick="yourImageId.reload()"&gt;try again&lt;/button&gt;</code>.
      <a href="https://perchance.org/text-to-image-custom-reload-button-example#edit" target="_blank">Here's an example generator</a> that does that.
    </li>
    <li>
      The model <b>can return NSFW/adult-themed results</b> if prompted with NSFW/adult-themed terms. <b>Treat this like a Google image search</b>, and prompt responsibly. You can add terms like "NSFW" and "nudity" to the <code>negativePrompt</code> option as a way to reduce the probability that
      you'll get accidental NSFW results. May also want to add "fully clothed" to the <code>prompt</code> in some cases.
    </li>
    <li>Each user can only have a few concurrent server requests, so if you have lots of images on one page, they'll queue up.</li>
    <li>
      The 19th day of every month is observed as 'Ad-viewer Appreciation Day' in the Perchance community. On this day we pay our respects to the non-logged-in users who fund the GPU servers by viewing ads on generators that import AI-based plugins. Logged-in users are encouraged to spare a moment
      for these anonymous benefactors, wishing for them a month of relevant and interesting ads, and thanking them for their tolerance of increased browser tab memory usage, and their indirect but valuable contribution to the Perchance community via the digital attention economy. May their mobile
      game ads not be too sus, and may the gameplay reflect the real gameplay even if only abstractly 🕯️
    </li>
    <li>Check out more plugins at <a href="/plugins">perchance.org/plugins</a></li>
  </ul>
  <p>
    As some inspiration, here are some images produced using the prompt "<i
      >fantasy \[thing\], extremely detailed oil painting, unreal 5 render, rhads, bruce pennington, studio ghibli, tim hildebrandt, digital art, octane render, beautiful composition, trending on artstation, award-winning photograph, masterpiece</i
    >":
  </p>
  <img src="https://i.imgur.com/YNcf0Hj.jpg" style="max-width:100%;" />
</main>
<p style="text-align:center; font-size:200%; opacity:0.2; margin-top:0.5em;"><span>⚄&#xFE0E;</span></p>
<br /><br /><br />

<style>
  html {
    color-scheme: dark light;
  }
  main {
    text-align: left;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    background: light-dark(#fff, #101010);
    padding: 1em;
    border-radius: 3px;
    box-shadow:
      0 0.5px 0 0 #ffffff inset,
      0 1px 2px 0 #b3b3b3;
    box-shadow:
      0 0.5px 0 0 light-dark(#fff, #060606) inset,
      0 1px 2px 0 light-dark(#b3b3b3, #2c2c2c);
  }
  ul li {
    margin-top: 0.5em;
  }
  p {
    line-height: 1.4em;
  }
  main p:first-child {
    margin-top: 0;
  }
  body {
    background-color: #f6f6f6;
    background-color: light-dark(#f6f6f6, #000);
    color: black;
    color: light-dark(black, #d6d6d6);
  }
  pre {
    text-align: left;
    background: #333;
    background: light-dark(#333, #212121);
    color: #e2e2e2;
    padding: 1em;
    border-radius: 2px;
    tab-size: 2;
    -moz-tab-size: 2;
    -o-tab-size: 2;
    -webkit-tab-size: 2;
  }
  code {
    background: #eff0f1;
    background: light-dark(#eff0f1, #272727);
    padding: 1px 5px;
    white-space: nowrap;
  }
</style>
```
