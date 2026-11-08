"""New direct-drawn editorial illustration candidates. Never imports rejected old artwork.
These are original SVG paths informed by actual-animal reference, not image generation.
Anatomy review is separate from technical file validity; no automatic production approval.
"""
from pathlib import Path
import math,random,json
import cairosvg
P=Path(__file__).resolve().parents[1];A=P/'assets/species';A.mkdir(parents=True,exist_ok=True)
DEFS='''<defs>
<linearGradient id="blue" x1="0" y1="0" x2="0.2" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#a3c4cf"/><stop offset=".33" stop-color="#739bad"/><stop offset=".73" stop-color="#52768e"/><stop offset="1" stop-color="#a9c1cb"/></linearGradient>
<linearGradient id="fin" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#789aa9"/><stop offset=".55" stop-color="#496879"/><stop offset="1" stop-color="#304c61"/></linearGradient>
<linearGradient id="belly" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c8d5d5" stop-opacity="0"/><stop offset=".63" stop-color="#d5ddda" stop-opacity=".5"/><stop offset="1" stop-color="#b6cdce"/></linearGradient>
<linearGradient id="grey" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#afb5a9"/><stop offset=".28" stop-color="#8f9a95"/><stop offset=".66" stop-color="#657976"/><stop offset="1" stop-color="#bdc3b5"/></linearGradient>
<linearGradient id="sealfin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8f9a91"/><stop offset="1" stop-color="#455b59"/></linearGradient>
<linearGradient id="fur" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#c5a47d"/><stop offset=".32" stop-color="#997452"/><stop offset=".72" stop-color="#72553f"/><stop offset="1" stop-color="#473c33"/></linearGradient>
<linearGradient id="furfin"><stop stop-color="#84684b"/><stop offset="1" stop-color="#3b3830"/></linearGradient>
<radialGradient id="eye"><stop stop-color="#3d3b31"/><stop offset=".58" stop-color="#171f20"/><stop offset="1" stop-color="#070f15"/></radialGradient>
</defs>'''
def path(d,fill,stroke='none',sw=1,extra=''):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def spots(seed,body,colour,count,extent,opacity=.12):
 r=random.Random(seed);out=[];x0,y0,x1,y1=extent
 for _ in range(count):
  x=r.uniform(x0,x1);y=r.uniform(y0,y1);rx=r.uniform(3,22);ry=r.uniform(2,11)
  d=f'M{x-rx:.1f} {y:.1f} C{x-rx:.1f} {y-ry:.1f} {x-rx*.2:.1f} {y-ry*1.3:.1f} {x+rx*.6:.1f} {y-ry*.4:.1f} S{x+rx*1.2:.1f} {y+ry:.1f} {x+rx*.3:.1f} {y+ry*.8:.1f} S{x-rx:.1f} {y+ry*.6:.1f} {x-rx:.1f} {y:.1f} Z'
  out.append(path(d,colour,extra=f'opacity="{r.uniform(opacity*.3,opacity):.3f}"'))
 return f'<g clip-path="url(#{body})">'+''.join(out)+'</g>'
def save(name,content,description):
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><title>{description}</title>{DEFS}{content}</svg>'
 (A/(name+'.svg')).write_text(svg);cairosvg.svg2png(bytestring=svg.encode(),write_to=str(A/(name+'.png')))

def blue_whale():
 # A flattened rostrum, small posterior dorsal and long slender pectorals distinguish this from the old generic whale.
 body='M130 427 C152 395 213 364 306 347 C445 317 604 322 765 345 C971 375 1146 410 1322 418 C1373 420 1411 417 1441 414 L1455 437 C1405 445 1360 448 1316 451 C1193 466 1107 496 959 517 C789 544 620 550 469 525 C312 502 216 477 159 452 C141 444 132 435 130 427 Z'
 o='<defs><clipPath id="bluebody">'+path(body,'white')+'</clipPath></defs>'
 # Far pectoral and far fluke precede the body; every root lies beneath the skin surface.
 o+=path('M1408 426 C1416 404 1437 374 1485 350 C1492 382 1483 410 1455 437 Z','url(#fin)','#3c5c6b',1.3)
 o+=path(body,'url(#blue)','#416579',1.6)
 o+=path('M131 428 C288 452 390 479 553 493 C808 518 1016 482 1201 451 C1301 434 1361 434 1437 432 L1454 439 C1323 451 1174 496 983 525 C771 558 580 551 402 518 C261 492 158 460 131 428 Z','url(#belly)')
 o+=spots(42,'bluebody','#cfddd9',180,(240,320,1350,540),.20)+spots(340,'bluebody','#355f78',170,(190,320,1390,548),.13)
 # Grooves are smoothly curved, follow the lower throat and stop around the belly, not the tail.
 for i in range(23):
  a=i/22;y=442+a*45;endx=639+a*146;endy=478+a*54
  o+=path(f'M{163+a*85:.1f} {y:.1f} C{292+a*76:.1f} {y+35:.1f} {430+a*88:.1f} {endy+20:.1f} {endx:.1f} {endy:.1f}','none','#496b7c',.9,extra='opacity=".48"')
 o+=path('M132 428 C240 420 380 440 530 473','none','#304f62',2.8)
 o+=path('M159 434 C267 431 372 448 490 477','none','#d0dbd7',1.2,extra='opacity=".6"')
 # Tiny eye, not an invented conspicuous cartoon face.
 o+='<ellipse cx="329" cy="417" rx="7.4" ry="5" fill="#2c4957"/><ellipse cx="330" cy="417" rx="3.3" ry="3.1" fill="#0f2839"/><circle cx="329" cy="416" r="1" fill="#dbe4df"/>'
 o+=path('M320 357 Q330 351 339 354 M341 354 Q351 349 359 354','none','#345565',2.1)
 o+=path('M1121 390 C1139 384 1148 365 1165 362 C1161 377 1161 391 1188 407 C1155 405 1139 401 1121 390 Z','url(#fin)','#4c6d80',1.1)
 o+=path('M484 481 C519 480 542 489 560 509 C593 546 633 595 695 629 C661 635 627 625 603 608 C552 574 517 529 484 481 Z','url(#fin)','#416176',1.5)
 o+=path('M503 492 C550 531 574 579 637 610','none','#a6c0c5',1.4,extra='opacity=".5"')
 o+=path('M1418 425 C1455 428 1472 459 1538 482 C1511 496 1471 493 1446 475 C1434 461 1421 449 1408 443 Z','url(#fin)','#3d5e70',1.3)
 o+=path('M1438 440 C1457 450 1467 463 1489 474','none','#a0bdc2',1.1,extra='opacity=".6"')
 save('blue_whale_three_quarter',o,'Original blue whale illustration candidate; flattened head, mottled blue-grey skin, ventral grooves, small posterior dorsal and horizontal flukes. Not exact anatomical scale.')

def weddell():
 body='M216 445 C192 421 216 386 247 371 C265 338 306 328 342 348 C367 362 379 379 396 391 C543 329 688 316 849 330 C1041 350 1170 432 1269 500 C1300 521 1330 530 1360 533 C1341 557 1324 570 1292 578 C1153 625 966 660 785 647 C610 638 477 581 392 508 C352 485 292 475 253 465 C236 459 226 452 216 445 Z'
 o='<defs><clipPath id="sealbody">'+path(body,'white')+'</clipPath></defs>'
 o+=path('M1281 535 C1336 528 1414 535 1478 566 C1448 582 1409 582 1364 568 C1400 598 1414 617 1411 631 C1353 626 1317 599 1281 571 Z','url(#sealfin)','#465d5d',1.5)
 o+=path(body,'url(#grey)','#566b68',1.5)
 o+=spots(710,'sealbody','#3a514f',270,(280,328,1350,640),.19)+spots(920,'sealbody','#d4d6c4',210,(300,350,1340,653),.17)
 o+=path('M246 430 C274 399 320 388 355 410 C374 437 364 466 333 478 C295 477 255 460 246 430 Z','#afb5a5',extra='opacity=".24"')
 o+=path('M473 526 C489 550 512 587 554 619 C580 638 600 664 602 686 C556 681 504 655 470 624 C442 597 425 572 432 553 Z','url(#sealfin)','#4b6260',1.2)
 for i in range(4):o+=path(f'M{466+i*10} {575+i*8} Q{510+i*10} {629+i*8} {567+i*9} {670+i*2}','none','#c2c8b7',1,extra='opacity=".45"')
 o+='<ellipse cx="278" cy="391" rx="10" ry="9" fill="#58645c"/><ellipse cx="278" cy="391" rx="6.8" ry="6.5" fill="url(#eye)"/><ellipse cx="274" cy="388" rx="1.8" ry="1.4" fill="#d4dfdb"/>'
 o+=path('M219 422 Q233 412 248 418 Q247 435 233 439 Q221 434 219 422 Z','#384a47')
 o+=path('M232 439 L246 446 L259 448','none','#425450',1.6)
 for i in range(9):
  o+=path(f'M{238+i*.6:.1f} {440+i*.7:.1f} Q{213-i*2:.1f} {432+i*6:.1f} {182-i*2:.1f} {420+i*10:.1f}','none','#d5d6bf',.8)
 for i in range(5):o+=path(f'M{1324+i*10} {547+i*2} Q{1401+i*5} {552+i*5} {1452-i*7} {568+i*8}','none','#b8c1b0',1,extra='opacity=".45"')
 save('weddell_seal_resting',o,'Original Weddell seal candidate; small earless head, short front flippers, mottled coat and paired hind flippers. Distinct from an Argentine sea lion pup.')

def pup():
 body='M470 310 C456 288 467 266 491 251 C513 216 554 211 584 236 C619 264 617 310 600 351 C600 410 624 475 699 508 C791 538 936 522 1054 563 C1125 590 1193 637 1227 683 C1118 717 1011 714 895 706 C774 697 677 678 610 644 C537 609 501 551 498 489 C493 431 506 377 504 347 C489 342 478 327 470 310 Z'
 o='<defs><clipPath id="pupbody">'+path(body,'white')+'</clipPath></defs>'
 o+=path('M1153 667 C1253 670 1353 704 1422 745 C1349 772 1294 757 1242 724 C1253 749 1249 767 1232 781 C1179 756 1141 725 1111 694 Z','url(#furfin)','#453f33',1.4)
 o+=path(body,'url(#fur)','#584735',1.5)
 o+=path('M516 349 C521 390 533 446 560 489 C590 532 622 568 669 587 C610 548 572 463 570 390 C576 366 575 345 563 336 Z','#d0b187',extra='opacity=".48"')
 o+=path('M658 542 C686 561 714 593 745 618 C794 660 861 698 936 714 C896 735 848 734 798 710 C735 677 677 634 639 602 C621 579 630 556 658 542 Z','url(#furfin)','#514737',1.4)
 o+=path('M552 514 C531 565 527 619 556 676 C572 707 580 733 576 753 C548 764 527 757 512 741 C479 702 475 642 489 582 C498 541 515 517 552 514 Z','url(#furfin)','#4d4435',1.4)
 o+=path('M591 299 C605 279 612 285 609 302 C607 315 599 322 591 319 Z','#6b513b','#473b2f',1.2)
 o+='<ellipse cx="527" cy="276" rx="11" ry="12" fill="#785a40"/><ellipse cx="527" cy="276" rx="7.7" ry="8.4" fill="url(#eye)"/><ellipse cx="523" cy="272" rx="1.7" ry="2.1" fill="#dfe3d6"/>'
 o+=path('M468 295 C478 284 492 284 503 293 L499 305 Q483 314 472 307 Z','#3a3830')
 o+=path('M483 312 L495 317 L506 316','none','#443d31',1.7)
 for i in range(8):o+=path(f'M490 {310+i*.8:.1f} Q{455-i*3} {307+i*6} {425-i*3} {300+i*10}','none','#d0c2a0',.75)
 r=random.Random(87)
 for _ in range(600):
  x=r.uniform(488,1220);y=r.uniform(235,710);o+='<g clip-path="url(#pupbody)">'+path(f'M{x:.1f} {y:.1f} l{r.uniform(1,4):.1f} {r.uniform(3,7):.1f}','none','#d4b88f',.6,extra='opacity=".18"')+'</g>'
 save('sea_lion_pup_upright',o,'Original South American sea lion pup candidate; visible external ear, elevated neck, warm short coat and long weight-bearing front flippers. Not a Weddell seal.')

if __name__=='__main__':
 blue_whale();weddell();pup();print('Three original species illustrations built for internal review; not final-shot approvals.')
