import { ComposeListItem, CustomContentDialog, IconType, SymbolGlyphModifier } from '@kit.ArkUI'
import { database } from '@zxhhyj/storm'
import { Book, books } from '../model/Book'
import { Bookcase, bookcases } from '../model/Bookcase'

@Component
export struct BookPage {
  @Prop item: Bookcase
  @Link bookcasesList: Bookcase[]
  @State booksList: Book[] = database.of(books).query((wrapper => {
    return wrapper.equalTo(books.bookcase, this.item.id)
  }))
  @State bookName: string = ''
  bookCreateDialogController = new CustomDialogController({
    builder: CustomContentDialog({
      primaryTitle: '创建书籍',
      contentBuilder: () => {
        this.bookCreateDialogContent();
      },
      buttons: [
        {
          value: '创建',
          buttonStyle: ButtonStyleMode.TEXTUAL,
          action: () => {
            database.of(books).insertCount([{ bookcase: this.item, name: this.bookName }])
            this.booksList = database.of(books).query((wrapper => {
              return wrapper.equalTo(books.bookcase, this.item.id)
            }))
            this.bookCreateDialogController.close()
          }
        },
        {
          value: '取消',
          buttonStyle: ButtonStyleMode.TEXTUAL,
          role: ButtonRole.ERROR,
          action: () => {
            this.bookCreateDialogController.close()
            this.bookName = '';
          }
        }],
    }),
  });

  @Builder
  bookCreateDialogContent(): void {
    TextInput({ placeholder: '书籍名称', text: this.bookName })
      .onChange((value) => {
        this.bookName = value;
      })
  }

  build() {
    NavRouter() {
      ComposeListItem({
        contentItem: ({
          iconStyle: IconType.HEAD_SCULPTURE,
          icon: $r('sys.media.ohos_ic_public_text'),
          primaryText: `${this.item.name}`,
          secondaryText: `${this.item.id}`
        }),
        operateItem: ({
          icon: {
            value: $r('sys.media.ohos_ic_public_remove'),
            action: () => {
              database.of(bookcases).removeIf((wrapper) => {
                return wrapper.equalTo(bookcases.id, this.item.id)
              })
              this.bookcasesList = database.of(bookcases).query()
            }
          }
        })
      })

      NavDestination() {
        List() {
          ListItemGroup({ style: ListItemGroupStyle.CARD }) {
            ForEach(this.booksList, (item: Book) => {
              ComposeListItem({
                contentItem: ({
                  iconStyle: IconType.HEAD_SCULPTURE,
                  icon: $r('sys.media.media_sound'),
                  primaryText: `${item.name}`,
                  secondaryText: `${item.id}`
                }),
                operateItem: ({
                  icon: {
                    value: $r('sys.media.ohos_ic_public_remove'),
                    action: () => {
                      database.of(books).removeIf((wrapper) => {
                        return wrapper.equalTo(books.id, item.id)
                      })
                    }
                  }
                })
              })
            })
          }
        }
        .width('100%')
        .height('100%')
      }
      .menus([{
        value: 'add', symbolIcon: new SymbolGlyphModifier($r('sys.symbol.plus')), action: () => {
          this.bookCreateDialogController.open()
        }
      }])
      .title(this.item.name)
    }
  }
}