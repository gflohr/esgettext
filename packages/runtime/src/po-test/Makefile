# Makefile for various po files. This Makefile is intended for the
# maintainer. No problem if you cannot run it on your system.

srcdir = .
top_srcdir = ../..

LINGUAS = de de_AT fi_FI
PACKAGES = existing additional

#CATALOGS = $(addsuffix .po, LINGUAS)
CATALOGS = $(LINGUAS)
MO_FILES = $(foreach pkg,$(PACKAGES), $(addprefix $(pkg)., $(addsuffix .gmo, $(LINGUAS))))
JSON_FILES = $(foreach pkg,$(PACKAGES), $(addprefix $(pkg)., $(addsuffix .mo.json, $(LINGUAS))))

MSGMERGE  = msgmerge
MSGFMT    = msgfmt
MO2JSON   = ../../../tools/bin/mo2json.js

all: default

default: install

install: $(MO_FILES) $(JSON_FILES)
	cd $(srcdir); \
	targetdir='$(top_srcdir)/src/locale'; \
	languages='$(LINGUAS)'; \
	packages='$(PACKAGES)'; \
	for package in $$packages; do \
		for lang in $$languages; do \
			mkdir -p "$$targetdir/$$lang/LC_MESSAGES"; \
			dest="$$targetdir/$$lang/LC_MESSAGES/$$package.mo"; \
			mocat="$$package.$$lang.gmo"; \
			echo "installing $$mocat as $$dest"; \
			install -C $$mocat $$dest && chmod 644 $$dest || exit 1; \
			dest="$$targetdir/$$lang/LC_MESSAGES/$$package.mo.json"; \
			jsoncat="$$package.$$lang.mo.json"; \
			echo "installing $$jsoncat as $$dest"; \
			mkdir -p "$$targetdir/$$lang/LC_MESSAGES"; \
			install -C $$jsoncat $$dest && chmod 644 $$dest || exit 1; \
		done; \
	done

$(JSON_FILES): $(MO_FILES)

clean:
	rm -f $(MO_FILES) $(JSON_FILES) *~

.SUFFIXES:
.SUFFIXES: .po .gmo .mo.json

.po.gmo:
	$(MSGFMT) --check --statistics --verbose -o $@ $<

.gmo.mo.json:
	$(MO2JSON) --input=$< >$@
