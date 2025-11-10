<!-- objective -->

share my ki

<!-- realization -->

_i have realized that i need to be sharing what i am building with my ki._

<!-- share media library -->

**user needs**:

- be able to mark media items in library as public. media item is added to a list of images/media that is displayed in the web app in an object like the one below.
- when i share document in document editor, it also displays in the web app --- clickable cards for the web journal items i have created and made public.
  - same ui for the web/documents list view with clickable modals that open to the document content

```
import Masonry from './Masonry';

const items = [
    {
      id: "1",
      img: "https://picsum.photos/id/1015/600/900?grayscale",
      url: "https://example.com/one",
      height: 400,
    },
    {
      id: "2",
      img: "https://picsum.photos/id/1011/600/750?grayscale",
      url: "https://example.com/two",
      height: 250,
    },
    {
      id: "3",
      img: "https://picsum.photos/id/1020/600/800?grayscale",
      url: "https://example.com/three",
      height: 600,
    },
    // ... more items
];

<Masonry
  items={items}
  ease="power3.out"
  duration={0.6}
  stagger={0.05}
  animateFrom="bottom"
  scaleOnHover={true}
  hoverScale={0.95}
  blurToFocus={true}
  colorShiftOnHover={false}
/>
```

<!-- continue building out -->
