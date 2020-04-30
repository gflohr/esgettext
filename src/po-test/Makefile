# Makefile for various po files. This Makefile is intended for the
# maintainer. No problem if you cannot run it on your system.

srcdir = .
top_srcdir = ..

LINGUAS = de de_AT xy xy_XY
PACKAGES = existing additional

#CATALOGS = $(addsuffix .po, LINGUAS)
CATALOGS = $(LINGUAS)
MO_FILES = $(foreach pkg,$(PACKAGES), $(addprefix $(pkg)., $(addsuffix .gmo, $(LINGUAS))))
JSON_FILES = $(foreach pkg,$(PACKAGES), $(addprefix $(pkg)., $(addsuffix .json, $(LINGUAS))))

MSGMERGE = msgmerge
MSGFMT   = msgfmt
CATOBJEXT = .po

all: default

default: install

install: $(MO_FILES) $(JSON_FILES)
	cd $(srcdir); \
	targetdir='$(top_srcdir)/assets/locale'; \
	languages='$(LINGUAS)'; \
	packages='$(PACKAGES)'; \
	for package in $$packages; do \
		for lang in $$languages; do \
			dest="$$targetdir/$$lang/LC_MESSAGES/$$package.mo"; \
			mocat="$$package.$$lang.gmo"; \
			echo "installing $$mocat as $$dest"; \
			mkdir -p "$$targetdir/$$lang/LC_MESSAGES"; \
			install -C $$mocat $$dest && chmod 644 $$dest || exit 1; \
			jsoncat="$$package.$$lang.json"; \
			echo "installing $$jsoncat as $$dest"; \
			mkdir -p "$$targetdir/$$lang/LC_MESSAGES"; \
			install -C $$jsoncat $$dest && chmod 644 $$dest || exit 1; \
		done; \
	done

$(JSON_FILES): $(MO_FILES)

clean:
	rm -f $(MO_FILES) $(JSON_FILES) *~

.SUFFIXES:
.SUFFIXES: .po .gmo

.po.gmo:
	$(MSGFMT) --check --statistics --verbose -o $@ $<

.gmo.json:
	$(MO2JSON) $< >$@
